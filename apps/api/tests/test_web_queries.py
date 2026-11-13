import os
from datetime import datetime
from types import SimpleNamespace

os.environ.setdefault("DATABASE_URL", "sqlite://")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.main import app
from app.repositories.flood.flood_event import FloodEventRepository
from app.services.flood.flood_event import FloodEventService


@pytest.fixture
def db():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False})
    with engine.connect() as connection:
        connection.exec_driver_sql("ATTACH DATABASE ':memory:' AS core")
        for sql in [
            "CREATE TABLE core.regency (id INTEGER PRIMARY KEY, code TEXT, name TEXT, province_code TEXT, geom TEXT)",
            "CREATE TABLE core.districts (id INTEGER PRIMARY KEY, code TEXT, name TEXT, regency_id INTEGER, geom TEXT)",
            "CREATE TABLE core.flood_events (id INTEGER PRIMARY KEY, regency_id INTEGER, event_type_id INTEGER, event_datetime DATETIME)",
            "CREATE TABLE core.flood_event_impacts (id INTEGER PRIMARY KEY, flood_event_id INTEGER, schools_damaged INTEGER, health_facilities_damaged INTEGER, religious_facilities_damaged INTEGER)",
        ]:
            connection.exec_driver_sql(sql)
        connection.exec_driver_sql("INSERT INTO core.regency VALUES (14, '1', 'Kota Bogor', '32', 'large geometry'), (4, '2', 'Bogor', '32', 'large geometry')")
        connection.exec_driver_sql("INSERT INTO core.districts VALUES (545, '1', 'Tanah Sareal', 14, 'large geometry')")
        connection.exec_driver_sql("INSERT INTO core.flood_events VALUES (1,14,1,'2010-05-01 12:00:00.000000'), (2,14,1,'2010-06-01 12:00:00.000000'), (3,4,1,'2025-01-01 12:00:00.000000'), (4,4,1,'2026-01-01 12:00:00.000000')")
        connection.exec_driver_sql("INSERT INTO core.flood_event_impacts VALUES (1,1,2,0,1), (2,1,1,0,0), (3,2,0,NULL,2), (4,3,10,5,8)")
        connection.commit()
        queries = []
        event.listen(engine, "before_cursor_execute", lambda conn, cursor, statement, parameters, context, many: queries.append(statement))
        with Session(bind=connection) as session:
            session.info["queries"] = queries
            yield session
    engine.dispose()


def test_facilities_one_query_filters_dates_and_preserves_null(db):
    result = FloodEventService.get_facility_totals(
        db, regency_ids=[14, 14], start_date=datetime(2010, 1, 1), end_date=datetime(2010, 12, 31),
    )
    assert result.model_dump() == {"health": None, "education": 3, "worship": 3, "public": None, "data_kind": "historical_damage"}
    assert len(db.info["queries"]) == 1
    day = FloodEventService.get_facility_totals(db, regency_ids=[14], start_date=datetime(2010, 5, 1), end_date=datetime(2010, 5, 1, 23, 59, 59, 999999))
    assert (day.health, day.education, day.worship) == (0, 3, 1)
    known = FloodEventService.get_facility_totals(db, regency_ids=[4], end_date=datetime(2025, 12, 31))
    assert (known.health, known.education, known.worship) == (5, 10, 8)
    unknown = FloodEventService.get_facility_totals(db, regency_ids=[4])
    assert unknown.health is None and unknown.education is None
    empty = FloodEventService.get_facility_totals(db, regency_ids=[999])
    assert (empty.health, empty.education, empty.worship) == (0, 0, 0)


def test_metadata_never_selects_geometry_and_dates_validate(db):
    app.dependency_overrides[get_db] = lambda: db
    try:
        with TestClient(app) as client:
            response = client.get("/api/v1/geography/catalog")
            assert response.status_code == 200
            assert len(response.json()["regencies"]) == 2
            assert response.json()["districts"][0]["regency_id"] == 14
            assert all("geom" not in query.lower() for query in db.info["queries"])
            db.info["queries"].clear()
            response = client.get("/api/v1/geography/regencies?include_geometry=false")
            assert response.status_code == 200
            assert all(row["geom"] is None for row in response.json())
            assert all("ST_AsGeoJSON" not in query for query in db.info["queries"])
            response = client.get("/api/v1/flood/facilities?regency_id=14&regency_id=14")
            assert response.status_code == 200 and response.json()["education"] == 3
            for query in ["regency_id=0", "start_date=2026-02-01&end_date=2026-01-01", "start_date=2026-01-01T00:00:00Z&end_date=2026-12-31"]:
                assert client.get("/api/v1/flood/facilities?" + query).status_code == 422
    finally:
        app.dependency_overrides.clear()


def test_event_pagination_has_unique_id_tiebreaker():
    statements = []

    class Database:
        def scalar(self, statement):
            return 0

        def scalars(self, statement):
            statements.append(str(statement))
            return SimpleNamespace(all=lambda: [])

    FloodEventRepository.get_all(Database(), limit=100, offset=100)
    assert "event_datetime DESC NULLS LAST, core.flood_events.id DESC" in statements[0]
