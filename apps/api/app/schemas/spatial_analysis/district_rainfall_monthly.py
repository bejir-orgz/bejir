from pydantic import BaseModel, ConfigDict


class DistrictRainfallMonthlyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    district_id: int
    year: int | None = None
    month: int
    n_piksel: int | None = None
    hujan_mm: float | None = None
