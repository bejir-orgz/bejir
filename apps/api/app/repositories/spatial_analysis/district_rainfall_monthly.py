from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.geography.district import District
from app.models.spatial_analysis import (
    DistrictRainfallClassification,
    DistrictRainfallMonthly,
)


class DistrictRainfallMonthlyRepository:

    @staticmethod
    def get_all(
        db: Session,
        *,
        district_id: int | None = None,
        regency_id: int | None = None,
        year: int | None = None,
        month: int | None = None,
    ) -> list[tuple[DistrictRainfallMonthly, DistrictRainfallClassification | None]]:
        statement = select(
            DistrictRainfallMonthly,
            DistrictRainfallClassification,
        ).outerjoin(
            DistrictRainfallClassification,
            DistrictRainfallClassification.district_id
            == DistrictRainfallMonthly.district_id,
        )

        if regency_id is not None:
            statement = statement.join(
                District,
                District.id == DistrictRainfallMonthly.district_id,
            ).where(District.regency_id == regency_id)

        if district_id is not None:
            statement = statement.where(
                DistrictRainfallMonthly.district_id == district_id
            )

        # A year filter intentionally excludes climatology rows (year IS NULL).
        if year is not None:
            statement = statement.where(
                DistrictRainfallMonthly.year == year
            )

        if month is not None:
            statement = statement.where(
                DistrictRainfallMonthly.month == month
            )

        statement = statement.order_by(
            DistrictRainfallMonthly.district_id.asc(),
            DistrictRainfallMonthly.year.asc(),
            DistrictRainfallMonthly.month.asc(),
        )

        return list(db.execute(statement).all())
