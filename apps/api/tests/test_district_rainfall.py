import os

os.environ.setdefault("DATABASE_URL", "sqlite://")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.main import app
from app.services.spatial_analysis import (
    DistrictRainfallMonthlyService,
    RegencyRainfallMonthlyService,
)


@pytest.fixture
def db():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False})
    with engine.connect() as connection:
        connection.exec_driver_sql("ATTACH DATABASE ':memory:' AS core")
        for sql in [
            "CREATE TABLE core.regency (id INTEGER PRIMARY KEY, code TEXT, name TEXT, province_code TEXT, geom TEXT)",
            "CREATE TABLE core.districts (id INTEGER PRIMARY KEY, code TEXT, name TEXT, regency_id INTEGER, geom TEXT)",
            "CREATE TABLE core.district_rainfall_monthly (id INTEGER PRIMARY KEY, district_id INTEGER, year INTEGER, month INTEGER, n_piksel INTEGER, n_piksel_hujan INTEGER, hujan_mm FLOAT)",
            "CREATE TABLE core.district_rainfall_classification (id INTEGER PRIMARY KEY, district_id INTEGER, n_piksel INTEGER, mean_hujan_mm FLOAT, kelas_hujan INTEGER, label_hujan TEXT)",
            "CREATE TABLE core.regency_rainfall_classification (id INTEGER PRIMARY KEY, regency_id INTEGER, n_kec INTEGER, n_kec_berdata INTEGER, mean_hujan_mm FLOAT, min_kec_mm FLOAT, maks_kec_mm FLOAT, kelas_hujan INTEGER, label_hujan TEXT)",
        ]:
            connection.exec_driver_sql(sql)
        connection.exec_driver_sql(
            "INSERT INTO core.regency VALUES (4, '32.01', 'Bogor', '32', 'geom'), (14, '32.16', 'Bekasi', '32', 'geom')"
        )
        connection.exec_driver_sql(
            "INSERT INTO core.districts VALUES (545, '32.01.01', 'Cibinong', 4, 'geom'), (546, '32.01.02', 'Gunungputri', 4, 'geom'), (700, '32.16.03', 'Sukawangi', 14, 'geom')"
        )
        climatology = ",".join(
            f"({index}, 545, NULL, {month}, 52234, 50000, {300 + month * 10}.0)"
            for index, month in enumerate(range(1, 13), start=1)
        )
        gunungputri = ",".join(
            f"({300 + month}, 546, NULL, {month}, 67751, 67751, {200 + month * 10}.0)"
            for month in range(1, 13)
        )
        bekasi = ",".join(
            f"({100 + month}, 700, NULL, {month}, 77000, 0, NULL)"
            for month in range(1, 13)
        )
        connection.exec_driver_sql(
            "INSERT INTO core.district_rainfall_monthly "
            "(id, district_id, year, month, n_piksel, n_piksel_hujan, hujan_mm) VALUES "
            + climatology + "," + gunungputri + "," + bekasi
            + ",(900, 545, 2015, 1, 52234, 51000, 111.1)"
        )
        connection.exec_driver_sql(
            "INSERT INTO core.district_rainfall_classification "
            "(id, district_id, n_piksel, mean_hujan_mm, kelas_hujan, label_hujan) VALUES "
            "(1, 545, 52234, 3908.7511, 5, 'Sangat Tinggi'), "
            "(2, 700, 77000, NULL, NULL, NULL), "
            "(3, 546, 67751, 3031.9535, 3, 'Sedang')"
        )
        connection.exec_driver_sql(
            "INSERT INTO core.regency_rainfall_classification "
            "(id, regency_id, n_kec, n_kec_berdata, mean_hujan_mm, min_kec_mm, "
            "maks_kec_mm, kelas_hujan, label_hujan) VALUES "
            "(1, 4, 40, 40, 3929.9326, 2874.9862, 4962.5962, 5, 'Sangat Tinggi'), "
            "(2, 14, 23, 16, 2212.1281, 1818.6451, 2720.4454, 1, 'Sangat Rendah')"
        )
        connection.commit()
        with Session(bind=connection) as session:
            yield session
    engine.dispose()


def test_rainfall_monthly_rows_preserve_missing_values(db):
    rows = DistrictRainfallMonthlyService.list_rainfall_monthly(db)
    assert len(rows) == 37
    assert rows[0].model_dump().keys() == {
        "district_id", "year", "month", "n_piksel", "hujan_mm",
        "kelas_hujan", "label_hujan",
    }
    cibinong = [row for row in rows if row.district_id == 545]
    assert all(row.n_piksel == 52234 for row in cibinong)
    assert all(row.kelas_hujan == 5 for row in cibinong)
    assert all(row.label_hujan == "Sangat Tinggi" for row in cibinong)
    bekasi = [row for row in rows if row.district_id == 700]
    assert len(bekasi) == 12
    assert all(row.hujan_mm is None for row in bekasi)
    assert all(row.kelas_hujan is None for row in bekasi)
    assert all(row.label_hujan is None for row in bekasi)
    assert all(row.n_piksel == 77000 for row in bekasi)
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
    assert len(january) == 4
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
            assert all(row["kelas_hujan"] is None for row in payload)
            assert all(row["label_hujan"] is None for row in payload)
            assert all(isinstance(row["district_id"], int) for row in payload)

            response = client.get(
                "/api/v1/spatial-analysis/district-rainfall-monthly?regency_id=4&month=2"
            )
            assert response.status_code == 200
            assert [(row["hujan_mm"], row["kelas_hujan"], row["label_hujan"]) for row in response.json()] == [
                (320.0, 5, "Sangat Tinggi"),
                (220.0, 3, "Sedang"),
            ]

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


def test_regency_rainfall_classification_endpoint(db):
    app.dependency_overrides[get_db] = lambda: db
    try:
        with TestClient(app) as client:
            response = client.get(
                "/api/v1/spatial-analysis/regency-rainfall-classification"
            )
            assert response.status_code == 200
            payload = response.json()
            assert [row["regency_id"] for row in payload] == [4, 14]

            response = client.get(
                "/api/v1/spatial-analysis/regency-rainfall-classification?regency_id=14"
            )
            assert response.status_code == 200
            assert response.json() == [
                {
                    "regency_id": 14,
                    "n_kec": 23,
                    "n_kec_berdata": 16,
                    "mean_hujan_mm": 2212.1281,
                    "min_kec_mm": 1818.6451,
                    "maks_kec_mm": 2720.4454,
                    "kelas_hujan": 1,
                    "label_hujan": "Sangat Rendah",
                }
            ]

            unknown = client.get(
                "/api/v1/spatial-analysis/regency-rainfall-classification?regency_id=99"
            )
            assert unknown.status_code == 200
            assert unknown.json() == []

            assert client.get(
                "/api/v1/spatial-analysis/regency-rainfall-classification?regency_id=0"
            ).status_code == 422
    finally:
        app.dependency_overrides.clear()


def test_regency_rainfall_monthly_weights_by_pixels(db):
    rows = RegencyRainfallMonthlyService.list_rainfall_monthly(db)

    # Regency 14 has no district with rainfall values, so it is omitted.
    assert len(rows) == 13
    assert all(row.regency_id == 4 for row in rows)

    january = rows[0]
    assert (january.year, january.month, january.period) == (None, 1, None)
    assert (january.n_kec, january.n_kec_berdata) == (2, 2)
    assert january.hujan_mm == pytest.approx(
        (310 * 50000 + 210 * 67751) / (50000 + 67751)
    )
    assert (january.min_mm, january.maks_mm) == (210.0, 310.0)

    yearly = [row for row in rows if row.year == 2015]
    assert len(yearly) == 1
    assert yearly[0].period == "2015-01"
    assert yearly[0].hujan_mm == 111.1
    assert (yearly[0].n_kec, yearly[0].n_kec_berdata) == (2, 1)


def test_regency_rainfall_monthly_endpoint(db):
    app.dependency_overrides[get_db] = lambda: db
    try:
        with TestClient(app) as client:
            response = client.get(
                "/api/v1/spatial-analysis/regency-rainfall-monthly?regency_id=4&month=2"
            )
            assert response.status_code == 200
            payload = response.json()
            assert len(payload) == 1
            assert payload[0]["regency_code"] == "32.01"
            assert payload[0]["period"] is None
            assert payload[0]["n_kec"] == 2
            assert payload[0]["hujan_mm"] == pytest.approx(
                (320 * 50000 + 220 * 67751) / (50000 + 67751)
            )

            assert client.get(
                "/api/v1/spatial-analysis/regency-rainfall-monthly?regency_id=14"
            ).json() == []

            response = client.get(
                "/api/v1/spatial-analysis/regency-rainfall-monthly?year=2015"
            )
            assert response.status_code == 200
            assert [row["period"] for row in response.json()] == ["2015-01"]

            for query in ["regency_id=0", "month=13", "year=1800"]:
                assert client.get(
                    "/api/v1/spatial-analysis/regency-rainfall-monthly?" + query
                ).status_code == 422
    finally:
        app.dependency_overrides.clear()
