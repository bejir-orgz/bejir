import os

os.environ.setdefault("DATABASE_URL", "sqlite://")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.main import app
from app.services.spatial_analysis import DistrictRainfallMonthlyService


@pytest.fixture
def db():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False})
    with engine.connect() as connection:
        connection.exec_driver_sql("ATTACH DATABASE ':memory:' AS core")
        for sql in [
            "CREATE TABLE core.regency (id INTEGER PRIMARY KEY, code TEXT, name TEXT, province_code TEXT, geom TEXT)",
            "CREATE TABLE core.districts (id INTEGER PRIMARY KEY, code TEXT, name TEXT, regency_id INTEGER, geom TEXT)",
            "CREATE TABLE core.district_rainfall_monthly (id INTEGER PRIMARY KEY, district_id INTEGER, year INTEGER, month INTEGER, n_piksel INTEGER, hujan_mm FLOAT)",
        ]:
            connection.exec_driver_sql(sql)
        connection.exec_driver_sql(
            "INSERT INTO core.regency VALUES (4, '32.01', 'Bogor', '32', 'geom'), (14, '32.16', 'Bekasi', '32', 'geom')"
        )
        connection.exec_driver_sql(
            "INSERT INTO core.districts VALUES (545, '32.01.01', 'Cibinong', 4, 'geom'), (700, '32.16.03', 'Sukawangi', 14, 'geom')"
        )
        climatology = ",".join(
            f"({index}, 545, NULL, {month}, 52234, {300 + month * 10}.0)"
            for index, month in enumerate(range(1, 13), start=1)
        )
        bekasi = ",".join(
            f"({100 + month}, 700, NULL, {month}, 0, NULL)"
            for month in range(1, 13)
        )
        connection.exec_driver_sql(
            "INSERT INTO core.district_rainfall_monthly "
            "(id, district_id, year, month, n_piksel, hujan_mm) VALUES "
            + climatology + "," + bekasi
            + ",(900, 545, 2015, 1, 51000, 111.1)"
        )
        connection.commit()
        with Session(bind=connection) as session:
            yield session
    engine.dispose()


def test_rainfall_monthly_rows_preserve_missing_values(db):
    rows = DistrictRainfallMonthlyService.list_rainfall_monthly(db)
    assert len(rows) == 25
    assert rows[0].model_dump().keys() == {
        "district_id", "year", "month", "n_piksel", "hujan_mm",
    }
    bekasi = [row for row in rows if row.district_id == 700]
    assert len(bekasi) == 12
    assert all(row.hujan_mm is None for row in bekasi)
    assert all(row.n_piksel == 0 for row in bekasi)
    assert bekasi[0].year is None


def test_rainfall_monthly_filters(db):
    by_regency = DistrictRainfallMonthlyService.list_rainfall_monthly(
        db, regency_id=14,
    )
    assert [row.district_id for row in by_regency] == [700] * 12

    by_district = DistrictRainfallMonthlyService.list_rainfall_monthly(
        db, district_id=545,
    )
    assert len(by_district) == 13
    assert all(row.district_id == 545 for row in by_district)

    yearly = DistrictRainfallMonthlyService.list_rainfall_monthly(db, year=2015)
    assert len(yearly) == 1
    assert (yearly[0].year, yearly[0].month, yearly[0].hujan_mm) == (2015, 1, 111.1)

    january = DistrictRainfallMonthlyService.list_rainfall_monthly(db, month=1)
    assert len(january) == 3
    assert all(row.month == 1 for row in january)


def test_rainfall_monthly_endpoint_returns_null_and_validates(db):
    app.dependency_overrides[get_db] = lambda: db
    try:
        with TestClient(app) as client:
            response = client.get(
                "/api/v1/spatial-analysis/district-rainfall-monthly?district_id=700"
            )
            assert response.status_code == 200
            payload = response.json()
            assert len(payload) == 12
            assert all(row["hujan_mm"] is None for row in payload)
            assert all(isinstance(row["district_id"], int) for row in payload)

            response = client.get(
                "/api/v1/spatial-analysis/district-rainfall-monthly?regency_id=4&month=2"
            )
            assert response.status_code == 200
            assert [row["hujan_mm"] for row in response.json()] == [320.0]

            for query in [
                "district_id=0",
                "month=13",
                "year=1800",
                "district_id=32.01.01",
            ]:
                assert client.get(
                    "/api/v1/spatial-analysis/district-rainfall-monthly?" + query
                ).status_code == 422
    finally:
        app.dependency_overrides.clear()
