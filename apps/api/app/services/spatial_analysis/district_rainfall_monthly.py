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
            DistrictRainfallMonthlyResponse(
                district_id=monthly.district_id,
                year=monthly.year,
                month=monthly.month,
                n_piksel=monthly.n_piksel,
                hujan_mm=monthly.hujan_mm,
                kelas_hujan=(
                    classification.kelas_hujan
                    if classification is not None
                    else None
                ),
                label_hujan=(
                    classification.label_hujan
                    if classification is not None
                    else None
                ),
            )
            for monthly, classification in records
        ]
