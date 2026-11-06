from pydantic import AliasPath, BaseModel, ConfigDict, Field


class DistrictHazardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    district_id: int
    district_name: str | None = Field(
        default=None,
        validation_alias=AliasPath("district", "name"),
    )

    n_desa: int | None = None
    n_piksel: int | None = None

    luas_km2: float | None = None
    luaswh_km2: float | None = None
    pct_cakupan: float | None = None

    mean_kerawanan_v1: float | None = None
    mean_kerawanan_v2: float | None = None
    mean_elevasi_m: float | None = None
    mean_hand_m: float | None = None
    mean_hujan_mm: float | None = None
    mean_slope_pct: float | None = None

    pct_rawan_v1: float | None = None
    pct_rawan_v2: float | None = None

    kelas_dominan_v2: int | None = None
    landcover_dominan: str | None = None
