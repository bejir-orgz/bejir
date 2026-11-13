from pydantic import BaseModel, PositiveInt


class RegencyMetadata(BaseModel):
    id: PositiveInt
    name: str


class DistrictMetadata(RegencyMetadata):
    regency_id: PositiveInt


class AdministrativeCatalog(BaseModel):
    regencies: list[RegencyMetadata]
    districts: list[DistrictMetadata]
