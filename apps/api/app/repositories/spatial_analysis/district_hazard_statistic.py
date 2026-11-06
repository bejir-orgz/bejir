
from sqlalchemy import select
from sqlalchemy.orm import Session, contains_eager, joinedload

from app.models.geography.district import District
from app.models.spatial_analysis import DistrictHazardStatistics


class DistrictHazardStatisticRepository:

    @staticmethod
    def get_all(
        db: Session,
        *,
        district_id: int | None = None,
        regency_id: int | None = None,
        kelas_dominan_v2: int | None = None,
        landcover_dominan: str | None = None,
    ) -> list[DistrictHazardStatistics]:

        statement = (
            select(DistrictHazardStatistics)
            .join(
                District,
                District.id == DistrictHazardStatistics.district_id,
            )
            .options(
                contains_eager(DistrictHazardStatistics.district),
            )
        )

        if district_id is not None:
            statement = statement.where(
                DistrictHazardStatistics.district_id == district_id
            )

        if regency_id is not None:
            statement = statement.where(District.regency_id == regency_id)

        if kelas_dominan_v2 is not None:
            statement = statement.where(
                DistrictHazardStatistics.kelas_dominan_v2
                == kelas_dominan_v2
            )

        if landcover_dominan is not None:
            statement = statement.where(
                DistrictHazardStatistics.landcover_dominan
                == landcover_dominan
            )

        statement = statement.order_by(District.name.asc())

        return list(db.scalars(statement).all())

    @staticmethod
    def get_by_id(
        db: Session,
        statistic_id: int,
    ) -> DistrictHazardStatistics | None:

        statement = (
            select(DistrictHazardStatistics)
            .options(
                joinedload(DistrictHazardStatistics.district),
            )
            .where(DistrictHazardStatistics.id == statistic_id)
        )

        return db.scalars(statement).unique().one_or_none()

    @staticmethod
    def get_by_district_id(
        db: Session,
        district_id: int,
    ) -> DistrictHazardStatistics | None:

        statement = (
            select(DistrictHazardStatistics)
            .options(
                joinedload(DistrictHazardStatistics.district),
            )
            .where(
                DistrictHazardStatistics.district_id == district_id
            )
        )

        return db.scalars(statement).unique().one_or_none()
