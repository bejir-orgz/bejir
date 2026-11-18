from app.repositories.spatial_analysis.district_hazard_statistic import (
    DistrictHazardStatisticRepository,
)
from app.repositories.spatial_analysis.population_exposure import (
    PopulationExposureRepository,
)
from app.repositories.spatial_analysis.district_rainfall_monthly import (
    DistrictRainfallMonthlyRepository,
)
from app.repositories.spatial_analysis.regency_rainfall_classification import (
    RegencyRainfallClassificationRepository,
)

__all__ = [
    "DistrictHazardStatisticRepository",
    "PopulationExposureRepository",
    "DistrictRainfallMonthlyRepository",
    "RegencyRainfallClassificationRepository",
]
