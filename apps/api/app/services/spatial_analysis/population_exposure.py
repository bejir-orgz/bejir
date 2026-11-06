from sqlalchemy.orm import Session

from app.repositories.spatial_analysis import PopulationExposureRepository
from app.schemas.spatial_analysis import PopulationExposureResponse


class PopulationExposureService:

    @staticmethod
    def list_population_exposures(
        db: Session,
        *,
        district_id: int | None = None,
        regency_id: int | None = None,
    ) -> list[PopulationExposureResponse]:
        exposures = PopulationExposureRepository.get_all(
            db,
            district_id=district_id,
            regency_id=regency_id,
        )

        return [
            PopulationExposureResponse.model_validate(exposure)
            for exposure in exposures
        ]

    @staticmethod
    def get_population_exposure(
        db: Session,
        exposure_id: int,
    ) -> PopulationExposureResponse | None:
        exposure = PopulationExposureRepository.get_by_id(
            db,
            exposure_id,
        )

        if exposure is None:
            return None

        return PopulationExposureResponse.model_validate(exposure)

    @staticmethod
    def get_population_exposure_by_district(
        db: Session,
        district_id: int,
    ) -> PopulationExposureResponse | None:
        exposure = PopulationExposureRepository.get_by_district_id(
            db,
            district_id,
        )

        if exposure is None:
            return None

        return PopulationExposureResponse.model_validate(exposure)
