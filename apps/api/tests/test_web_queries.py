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
from app.schemas.flood import FloodEventResponse
from app.services.flood.flood_event import FloodEventService
from app.services.flood.flood_event_impact import FloodEventImpactService


@pytest.fixture
def db():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False})
    with engine.connect() as connection:
        connection.exec_driver_sql("ATTACH DATABASE ':memory:' AS core")
        for sql in [
            "CREATE TABLE core.regency (id INTEGER PRIMARY KEY, code TEXT, name TEXT, province_code TEXT, geom TEXT)",
            "CREATE TABLE core.districts (id INTEGER PRIMARY KEY, code TEXT, name TEXT, regency_id INTEGER, geom TEXT)",
            "CREATE TABLE core.flood_event_types (id INTEGER PRIMARY KEY, code INTEGER, name TEXT)",
            "CREATE TABLE core.flood_events (id INTEGER PRIMARY KEY, regency_id INTEGER, event_type_id INTEGER, event_datetime DATETIME, event_id TEXT, regency_code TEXT, event_type_code INTEGER, event_count INTEGER)",
            "CREATE TABLE core.flood_event_impacts (id INTEGER PRIMARY KEY, flood_event_id INTEGER, fatalities INTEGER, missing INTEGER, injured INTEGER, affected_displaced INTEGER, houses_heavily_damaged INTEGER, houses_moderately_damaged INTEGER, houses_slightly_damaged INTEGER, houses_flooded INTEGER, schools_damaged INTEGER, religious_facilities_damaged INTEGER, health_facilities_damaged INTEGER, offices_damaged INTEGER, bridges_damaged INTEGER)",
        ]:
            connection.exec_driver_sql(sql)
        connection.exec_driver_sql("INSERT INTO core.regency VALUES (14, '1', 'Kota Bogor', '32', 'large geometry'), (4, '2', 'Bogor', '32', 'large geometry')")
        connection.exec_driver_sql("INSERT INTO core.districts VALUES (545, '1', 'Tanah Sareal', 14, 'large geometry')")
        connection.exec_driver_sql("INSERT INTO core.flood_event_types VALUES (1, 1, 'Banjir')")
        connection.exec_driver_sql(
            "INSERT INTO core.flood_events (id, regency_id, event_type_id, event_datetime) VALUES "
            "(1,14,1,'2010-05-01 12:00:00.000000'), (2,14,1,'2010-06-01 12:00:00.000000'), "
            "(3,4,1,'2025-01-01 12:00:00.000000'), (4,4,1,'2026-01-01 12:00:00.000000')"
        )
        connection.exec_driver_sql(
            "INSERT INTO core.flood_event_impacts "
            "(id, flood_event_id, schools_damaged, health_facilities_damaged, religious_facilities_damaged) "
            "VALUES (1,1,2,0,1), (2,1,1,0,0), (3,2,0,NULL,2), (4,3,10,5,8)"
        )
        connection.exec_driver_sql(
            "UPDATE core.flood_event_impacts SET fatalities = 7, missing = 2, houses_flooded = 15 WHERE id = 4"
        )
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


def test_impacts_overall_and_by_regency(db):
    result = FloodEventImpactService.get_impacts(db, regency_ids=[])
    assert result.overall.schools_damaged == 13
    assert result.overall.health_facilities_damaged == 5
    assert result.overall.religious_facilities_damaged == 11
    assert [(row.regency_id, row.regency_name) for row in result.by_regency] == [
        (4, "Bogor"),
        (14, "Kota Bogor"),
    ]
    bogor = result.by_regency[0]
    assert (bogor.schools_damaged, bogor.health_facilities_damaged) == (10, 5)
    assert len(db.info["queries"]) == 2

    filtered = FloodEventImpactService.get_impacts(
        db, regency_ids=[14], start_date=datetime(2010, 1, 1), end_date=datetime(2010, 12, 31),
    )
    assert filtered.overall.schools_damaged == 3
    assert filtered.overall.health_facilities_damaged == 0
    assert [row.regency_id for row in filtered.by_regency] == [14]


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
            response = client.get("/api/v1/flood/impacts?regency_id=14")
            assert response.status_code == 200
            assert response.json()["overall"]["schools_damaged"] == 3
            assert response.json()["by_regency"][0]["regency_name"] == "Kota Bogor"
            response = client.get("/api/v1/flood/impacts")
            assert response.status_code == 200
            assert response.json()["overall"]["schools_damaged"] == 13
            assert len(response.json()["by_regency"]) == 2
            for query in ["regency_id=0", "start_date=2026-02-01&end_date=2026-01-01", "start_date=2026-01-01T00:00:00Z&end_date=2026-12-31"]:
                assert client.get("/api/v1/flood/facilities?" + query).status_code == 422
                assert client.get("/api/v1/flood/impacts?" + query).status_code == 422
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


def test_flood_event_response_includes_event_type():
    event = SimpleNamespace(
        id=1,
        event_id="BNJ-001",
        event_datetime=None,
        regency_code=None,
        regency_id=14,
        event_type_code=1,
        event_type_id=1,
        event_count=True,
        event_type=SimpleNamespace(id=1, code=1, name="Banjir"),
    )

    response = FloodEventResponse.model_validate(event)

    assert response.model_dump()["event_type"] == {
        "id": 1,
        "code": 1,
        "name": "Banjir",
    }


def test_event_list_items_include_impact_summary(db):
    app.dependency_overrides[get_db] = lambda: db
    try:
        with TestClient(app) as client:
            response = client.get("/api/v1/flood/events")
            assert response.status_code == 200
            items = response.json()["items"]
            assert len(items) == 4
            for item in items:
                assert {"houses_flooded", "fatalities", "missing"} <= item.keys()
            by_id = {item["id"]: item for item in items}
            assert (by_id[3]["houses_flooded"], by_id[3]["fatalities"], by_id[3]["missing"]) == (15, 7, 2)
            assert by_id[4]["houses_flooded"] is None

            detail = client.get("/api/v1/flood/events/3")
            assert detail.status_code == 200
            body = detail.json()
            assert body["impacts"][0]["fatalities"] == 7
            assert "houses_flooded" not in body
    finally:
        app.dependency_overrides.clear()
