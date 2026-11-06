from pydantic import AliasPath, BaseModel, ConfigDict, Field


class PopulationExposureResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    district_id: int
    district_name: str | None = Field(
        default=None,
        validation_alias=AliasPath("district", "name"),
    )

    n_piksel: int | None = None
    luas_km2: float | None = None
    penduduk_est: int | None = None

    kepadatan_jiwa_km2: float | None = None

    pend_rawan_v2: int | None = None
    pct_rawan_v2: float | None = None

    pend_genangan_1m: int | None = None
    pct_genangan_1m: float | None = None

    pend_genangan_2m: int | None = None
    pct_genangan_2m: float | None = None

    pend_genangan_3m: int | None = None
    pct_genangan_3m: float | None = None
