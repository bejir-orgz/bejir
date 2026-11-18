from sqlalchemy.orm import Session

from app.repositories.spatial_analysis import (
    DistrictRainfallMonthlyRepository,
)
from app.schemas.spatial_analysis import DistrictRainfallMonthlyResponse


class DistrictRainfallMonthlyService:

    @staticmethod
    def list_rainfall_monthly(
        db: Session,
        *,
        district_id: int | None = None,
        regency_id: int | None = None,
        year: int | None = None,
        month: int | None = None,
    ) -> list[DistrictRainfallMonthlyResponse]:
        records = DistrictRainfallMonthlyRepository.get_all(
            db,
            district_id=district_id,
            regency_id=regency_id,
            year=year,
            month=month,
        )

        return [
            DistrictRainfallMonthlyResponse.model_validate(record)
            for record in records
        ]
