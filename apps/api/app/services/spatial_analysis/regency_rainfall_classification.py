from sqlalchemy.orm import Session

from app.repositories.spatial_analysis import (
    RegencyRainfallClassificationRepository,
)
from app.schemas.spatial_analysis import RegencyRainfallClassificationResponse


class RegencyRainfallClassificationService:

    @staticmethod
    def list_classification(
        db: Session,
        *,
        regency_id: int | None = None,
    ) -> list[RegencyRainfallClassificationResponse]:
        records = RegencyRainfallClassificationRepository.get_all(
            db,
            regency_id=regency_id,
        )

        return [
            RegencyRainfallClassificationResponse.model_validate(record)
            for record in records
        ]
