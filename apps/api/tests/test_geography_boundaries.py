import os

os.environ.setdefault("DATABASE_URL", "sqlite://")

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.api.endpoints.geography import parse_bbox
from app.db.session import get_db
from app.main import app


def test_parse_bbox_accepts_epsg4326_bounds():
    assert parse_bbox("106.3,-7.9,108.9,-5.7") == (
        106.3, -7.9, 108.9, -5.7,
    )
    assert parse_bbox(" 106, -7, 107, -6 ") == (106.0, -7.0, 107.0, -6.0)


@pytest.mark.parametrize(
    "value",
    [
        "106,-7,107",
        "106,-7,107,-6,1",
        "nan,-7,107,-6",
        "inf,-7,107,-6",
        "106,-7,106,-6",
        "106,-7,107,-7",
        "106,-91,107,-6",
        "-181,-7,107,-6",
        "abc,-7,107,-6",
    ],
)
def test_parse_bbox_rejects_invalid_bounds(value):
    with pytest.raises(HTTPException) as error:
        parse_bbox(value)
    assert error.value.status_code == 422


def test_boundary_endpoint_validates_request_before_query():
    app.dependency_overrides[get_db] = lambda: None
    try:
        with TestClient(app) as client:
            for query in [
                "?level=district",
                "?level=district&bbox=106,-7,107",
                "?level=district&bbox=106,-7,106,-6",
                "?level=regency&bbox=106,-7,107,-6",
                "?level=district&bbox=106,-7,107,-6&simplify_m=5000",
                "?level=district&bbox=106,-7,107,-6&limit=0",
            ]:
                response = client.get(
                    "/api/v1/geography/boundaries" + query
                )
                assert response.status_code == 422
    finally:
        app.dependency_overrides.clear()
