from pydantic import BaseModel, ConfigDict


class RegencyRainfallClassificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    regency_id: int
    n_kec: int | None = None
    n_kec_berdata: int | None = None
    mean_hujan_mm: float | None = None
    min_kec_mm: float | None = None
    maks_kec_mm: float | None = None
    kelas_hujan: int | None = None
    label_hujan: str | None = None
