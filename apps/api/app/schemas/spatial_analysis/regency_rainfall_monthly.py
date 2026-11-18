from pydantic import BaseModel, ConfigDict


class RegencyRainfallMonthlyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    regency_id: int
    regency_code: str | None = None
    regency_name: str | None = None

    # NULL year marks a climatology aggregate, same convention as the
    # district endpoint. period is null for those rows.
    year: int | None = None
    month: int
    period: str | None = None

    n_kec: int
    n_kec_berdata: int

    # Pixel-weighted mean of the districts that have rainfall data in this
    # period. NULL only if the regency has no district value at all.
    hujan_mm: float | None = None
    min_mm: float | None = None
    maks_mm: float | None = None
