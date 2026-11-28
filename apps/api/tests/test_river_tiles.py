import os

os.environ.setdefault("DATABASE_URL", "sqlite://")

import pytest
from fastapi import HTTPException

from app.api.endpoints.river import get_river_tile
from app.services.geography import RiverService


def test_river_tile_validates_xyz_and_passes_scope_to_repository(monkeypatch):
    calls = []

    def get_tile(db, **kwargs):
        calls.append(kwargs)
        return b"encoded tile"

    monkeypatch.setattr(RiverService, "get_tile", staticmethod(get_tile))

    with pytest.raises(HTTPException) as error:
        get_river_tile(z=8, x=256, y=130, regency_id=[], district_id=[], db=None)
    assert error.value.status_code == 422

    actual = get_river_tile(z=8, x=204, y=132, regency_id=[4], district_id=[], db=None)
    assert actual.status_code == 200
    assert actual.headers["content-type"] == "application/vnd.mapbox-vector-tile"
    assert actual.body == b"encoded tile"
    assert calls == [{"z": 8, "x": 204, "y": 132, "regency_ids": [4], "district_ids": []}]
