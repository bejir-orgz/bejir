from pydantic import BaseModel, ConfigDict


class RegencyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str | None = None
    name: str | None = None
    province_code: str | None = None