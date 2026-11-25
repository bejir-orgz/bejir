import os

os.environ.setdefault("DATABASE_URL", "sqlite://")

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.evacuation import EvacuationService, InvalidRouteRequestError


def test_sites_limit_max_is_1000():
    with TestClient(app) as client:
        spec = client.get("/openapi.json").json()
        params = spec["paths"]["/api/v1/evacuation/sites"]["get"]["parameters"]
        limit = next(param for param in params if param["name"] == "limit")
        assert limit["schema"]["maximum"] == 1000


def test_route_origin_validation_message_is_indonesian():
    with pytest.raises(InvalidRouteRequestError) as excinfo:
        EvacuationService.find_route(
            None,
            origin_longitude=999,
            origin_latitude=0,
            evacuation_site_id=None,
            travel_mode="driving",
        )
    assert str(excinfo.value) == (
        "Koordinat titik awal harus berupa nilai longitude/latitude EPSG:4326 yang valid"
    )
