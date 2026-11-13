from typing import Literal

from pydantic import BaseModel, NonNegativeInt


class FacilityTotals(BaseModel):
    health: NonNegativeInt | None
    education: NonNegativeInt | None
    worship: NonNegativeInt | None
    public: None = None
    data_kind: Literal["historical_damage"] = "historical_damage"
