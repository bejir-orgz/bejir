from pydantic import BaseModel, ConfigDict


class VillageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str | None = None
    name: str | None = None
    district_id: int