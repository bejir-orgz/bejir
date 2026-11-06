from sqlalchemy.orm import Session

from app.repositories.spatial_analysis import (
    DistrictHazardStatisticRepository,
)
from app.schemas.spatial_analysis import DistrictHazardResponse


class DistrictHazardStatisticService:

    @staticmethod
    def list_hazard_statistics(
        db: Session,
        *,
        district_id: int | None = None,
        regency_id: int | None = None,
        kelas_dominan_v2: int | None = None,
        landcover_dominan: str | None = None,
    ) -> list[DistrictHazardResponse]:
        statistics = DistrictHazardStatisticRepository.get_all(
            db,
            district_id=district_id,
            regency_id=regency_id,
            kelas_dominan_v2=kelas_dominan_v2,
            landcover_dominan=landcover_dominan,
        )

        return [
            DistrictHazardResponse.model_validate(statistic)
            for statistic in statistics
        ]

    @staticmethod
    def get_hazard_statistic(
        db: Session,
        statistic_id: int,
    ) -> DistrictHazardResponse | None:
        statistic = DistrictHazardStatisticRepository.get_by_id(
            db,
            statistic_id,
        )

        if statistic is None:
            return None

        return DistrictHazardResponse.model_validate(statistic)

    @staticmethod
    def get_hazard_statistic_by_district(
        db: Session,
        district_id: int,
    ) -> DistrictHazardResponse | None:
        statistic = DistrictHazardStatisticRepository.get_by_district_id(
            db,
            district_id,
        )

        if statistic is None:
            return None

        return DistrictHazardResponse.model_validate(statistic)
