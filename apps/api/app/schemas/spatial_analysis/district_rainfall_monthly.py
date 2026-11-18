from pydantic import BaseModel, ConfigDict


class DistrictRainfallMonthlyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    district_id: int
    year: int | None = None
    month: int
    n_piksel: int | None = None
    hujan_mm: float | None = None

    # Annual rainfall classification, repeated on every monthly row of the
    # district. Kelas is 1-5 (Sangat Rendah..Sangat Tinggi); both fields are
    # null for districts without CHIRPS coverage.
    kelas_hujan: int | None = None
    label_hujan: str | None = None
