from pydantic import BaseModel


class RiverRegencySummary(BaseModel):
    regency_id: int
    regency_name: str | None = None
    total: int
