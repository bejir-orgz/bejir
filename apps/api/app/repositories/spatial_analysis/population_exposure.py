
from sqlalchemy import select
from sqlalchemy.orm import Session, contains_eager, joinedload

from app.models.geography.district import District
from app.models.spatial_analysis import PopulationExposure


class PopulationExposureRepository:

    @staticmethod
    def get_all(
        db: Session,
        *,
        district_id: int | None = None,
        regency_id: int | None = None,
    ) -> list[PopulationExposure]:

        statement = (
            select(PopulationExposure)
            .join(
                District,
                District.id == PopulationExposure.district_id,
            )
            .options(
                contains_eager(PopulationExposure.district),
            )
        )

        if district_id is not None:
            statement = statement.where(
                PopulationExposure.district_id == district_id
            )

        if regency_id is not None:
            statement = statement.where(District.regency_id == regency_id)

        statement = statement.order_by(District.name.asc())

        return list(db.scalars(statement).all())

    @staticmethod
    def get_by_id(
        db: Session,
        exposure_id: int,
    ) -> PopulationExposure | None:

        statement = (
            select(PopulationExposure)
            .options(
                joinedload(PopulationExposure.district),
            )
            .where(PopulationExposure.id == exposure_id)
        )

        return db.scalars(statement).unique().one_or_none()

    @staticmethod
    def get_by_district_id(
        db: Session,
        district_id: int,
    ) -> PopulationExposure | None:

        statement = (
            select(PopulationExposure)
            .options(
                joinedload(PopulationExposure.district),
            )
            .where(PopulationExposure.district_id == district_id)
        )

        return db.scalars(statement).unique().one_or_none()
