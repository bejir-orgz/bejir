from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.spatial_analysis import RegencyRainfallClassification


class RegencyRainfallClassificationRepository:

    @staticmethod
    def get_all(
        db: Session,
        *,
        regency_id: int | None = None,
    ) -> list[RegencyRainfallClassification]:
        statement = select(RegencyRainfallClassification)

        if regency_id is not None:
            statement = statement.where(
                RegencyRainfallClassification.regency_id == regency_id
            )

        statement = statement.order_by(
            RegencyRainfallClassification.regency_id.asc(),
        )

        return list(db.scalars(statement).all())
