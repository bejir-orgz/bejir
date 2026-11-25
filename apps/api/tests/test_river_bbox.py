import os

os.environ.setdefault("DATABASE_URL", "sqlite://")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.main import app

GEOJSON = '{"type":"LineString","coordinates":[[106.8,-6.6],[106.9,-6.7]]}'


@pytest.fixture
def river_db():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False})
    with engine.connect() as connection:
        # Viewport SQL is asserted, not executed by PostGIS; SQLite only needs
        # the spatial functions to exist so the statement can run.
        raw = connection.connection.driver_connection
        raw.create_function("ST_MakeEnvelope", 5, lambda *args: "ENVELOPE")
        raw.create_function("ST_Transform", 2, lambda geometry, srid: geometry)

        def st_intersects(geometry, other):
            # The bbox envelope always matches; region geoms carry comma-separated
            # river tokens so the real-boundary filter can be exercised.
            if other == "ENVELOPE":
                return 1
            return int(bool(set(str(geometry).split(",")) & set(str(other).split(","))))

        raw.create_function("ST_Intersects", 2, st_intersects)
        raw.create_function("ST_Subdivide", 2, lambda geometry, maxvertices: geometry)
        raw.create_function("ST_SimplifyPreserveTopology", 2, lambda geometry, tolerance: geometry)
        # SQLAlchemy compiles func.ST_AsGeoJSON as AsGeoJSON on SQLite.
        raw.create_function("AsGeoJSON", -1, lambda *args: GEOJSON)
        raw.create_function("ST_AsGeoJSON", -1, lambda *args: GEOJSON)
        connection.exec_driver_sql("ATTACH DATABASE ':memory:' AS core")
        connection.exec_driver_sql(
            "CREATE TABLE core.rivers ("
            "id INTEGER PRIMARY KEY, fid INTEGER, source_id INTEGER, name TEXT, "
            "river_type TEXT, layer_code TEXT, shape_length FLOAT, geom TEXT)"
        )
        connection.exec_driver_sql(
            "INSERT INTO core.rivers VALUES "
            "(1, 1, 1, 'Ciliwung', 'Sungai', 'L1', 10.5, 'geom1'), "
            "(2, 2, 2, 'Cikapundung', 'Sungai', 'L1', 20.5, 'geom2'), "
            "(3, 3, 3, NULL, 'Saluran', 'L2', 30.5, 'geom3')"
        )
        connection.exec_driver_sql(
            "CREATE TABLE core.regency (id INTEGER PRIMARY KEY, name TEXT, geom TEXT)"
        )
        connection.exec_driver_sql(
            "CREATE TABLE core.districts ("
            "id INTEGER PRIMARY KEY, name TEXT, regency_id INTEGER, geom TEXT)"
        )
        connection.exec_driver_sql(
            "INSERT INTO core.regency VALUES "
            "(1, 'Kab A', 'geom1,geom2'), (2, 'Kab B', 'geom3')"
        )
        connection.exec_driver_sql(
            "INSERT INTO core.districts VALUES "
            "(10, 'Kec A1', 1, 'geom1'), (11, 'Kec A2', 1, 'geom2'), "
            "(12, 'Kec B1', 2, 'geom3')"
        )
        connection.commit()
        queries = []
        event.listen(
            engine,
            "before_cursor_execute",
            lambda conn, cursor, statement, parameters, context, many: queries.append(statement),
        )
        with Session(bind=connection) as session:
            session.info["queries"] = queries
            yield session
    engine.dispose()


def test_river_bbox_returns_viewport_page_with_truncated_flag(river_db):
    app.dependency_overrides[get_db] = lambda: river_db
    try:
        with TestClient(app) as client:
            response = client.get(
                "/api/v1/rivers?bbox=106.6,-6.9,107.1,-6.4&limit=2"
            )
            assert response.status_code == 200
            payload = response.json()
            assert payload["total"] == 3
            assert len(payload["items"]) == 2
            assert payload["truncated"] is True
            assert payload["bbox"] == [106.6, -6.9, 107.1, -6.4]
            # bbox implies the viewport default generalization
            assert payload["simplify_m"] == 100
            assert payload["limit"] == 2
            assert payload["offset"] == 0
            # Largest first so a truncated page is not a contiguous id range.
            assert [item["shape_length"] for item in payload["items"]] == [30.5, 20.5]
            assert [item["name"] for item in payload["items"]] == [None, "Cikapundung"]
            assert payload["items"][0]["geom"] == {
                "type": "LineString",
                "coordinates": [[106.8, -6.6], [106.9, -6.7]],
            }

            response = client.get(
                "/api/v1/rivers?bbox=106.6,-6.9,107.1,-6.4&simplify_m=0&limit=3"
            )
            payload = response.json()
            assert payload["simplify_m"] == 0
            assert payload["truncated"] is False
            assert len(payload["items"]) == 3

            statements = " ".join(river_db.info["queries"])
            assert "ST_Intersects" in statements
            assert "ST_MakeEnvelope" in statements
            assert "ST_SimplifyPreserveTopology" in statements
    finally:
        app.dependency_overrides.clear()


def test_river_without_bbox_keeps_legacy_pagination(river_db):
    app.dependency_overrides[get_db] = lambda: river_db
    try:
        with TestClient(app) as client:
            payload = client.get("/api/v1/rivers?limit=1").json()
            assert payload["total"] == 3
            assert len(payload["items"]) == 1
            assert payload["bbox"] is None
            assert payload["simplify_m"] is None
            assert payload["truncated"] is True
            assert "ST_Intersects" not in " ".join(river_db.info["queries"])
            assert "ST_SimplifyPreserveTopology" not in " ".join(river_db.info["queries"])
    finally:
        app.dependency_overrides.clear()


def test_river_regency_and_district_filters_use_real_boundary(river_db):
    app.dependency_overrides[get_db] = lambda: river_db
    try:
        with TestClient(app) as client:
            regency = client.get("/api/v1/rivers?regency_id=1").json()
            assert regency["total"] == 2
            assert {item["id"] for item in regency["items"]} == {1, 2}

            district = client.get("/api/v1/rivers?district_id=11").json()
            assert district["total"] == 1
            assert district["items"][0]["id"] == 2

            multiple = client.get(
                "/api/v1/rivers?district_id=10&district_id=11"
            ).json()
            assert multiple["total"] == 2
            assert {item["id"] for item in multiple["items"]} == {1, 2}

            combined = client.get(
                "/api/v1/rivers?regency_id=2&district_id=11"
            ).json()
            assert combined["total"] == 0

            statements = " ".join(river_db.info["queries"])
            assert "ST_Intersects" in statements
            assert "ST_Subdivide" in statements
            assert "core.regency" in statements
            assert "core.districts" in statements
    finally:
        app.dependency_overrides.clear()


def test_river_regency_summary_returns_counts_without_geometry(river_db):
    app.dependency_overrides[get_db] = lambda: river_db
    try:
        with TestClient(app) as client:
            response = client.get("/api/v1/rivers/summary")
            assert response.status_code == 200
            assert response.json() == [
                {"regency_id": 1, "regency_name": "Kab A", "total": 2},
                {"regency_id": 2, "regency_name": "Kab B", "total": 1},
            ]
            assert all("geom" not in row for row in response.json())
            assert "ST_Subdivide" in " ".join(river_db.info["queries"])
    finally:
        app.dependency_overrides.clear()


@pytest.mark.parametrize(
    "query",
    [
        "bbox=1,2,3",
        "bbox=abc,-6,107,-6.4",
        "bbox=106.6,-6.9,107.1",
        "bbox=nan,-6,107,-6.4",
        "bbox=180,-6.9,106,107",
        "bbox=106,10,106,10",
        "bbox=-6.9,106.6,-6.4,107.1",
        "simplify_m=3000",
        "limit=6000",
        "limit=0",
        "offset=-1",
        "regency_id=0",
        "district_id=0",
        "regency_id=abc",
        "district_id=-1",
    ],
)
def test_river_viewport_rejects_invalid_parameters(query):
    with TestClient(app) as client:
        assert client.get("/api/v1/rivers?" + query).status_code == 422
