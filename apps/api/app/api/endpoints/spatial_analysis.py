from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.spatial_analysis import (
    DistrictRainfallMonthlyResponse,
    RegencyRainfallClassificationResponse,
)
from app.services.spatial_analysis import (
    DistrictHazardStatisticService,
    DistrictRainfallMonthlyService,
    PopulationExposureService,
    RegencyRainfallClassificationService,
)

router = APIRouter()


@router.get(
    "/district-rainfall-monthly",
    response_model=list[DistrictRainfallMonthlyResponse],
)
def get_district_rainfall_monthly(
    district_id: int | None = Query(default=None, gt=0),
    regency_id: int | None = Query(default=None, gt=0),
    year: int | None = Query(default=None, ge=1900, le=2100),
    month: int | None = Query(default=None, ge=1, le=12),
    db: Session = Depends(get_db),
):
    return DistrictRainfallMonthlyService.list_rainfall_monthly(
        db,
        district_id=district_id,
        regency_id=regency_id,
        year=year,
        month=month,
    )


@router.get(
    "/regency-rainfall-classification",
    response_model=list[RegencyRainfallClassificationResponse],
)
def get_regency_rainfall_classification(
    regency_id: int | None = Query(default=None, gt=0),
    db: Session = Depends(get_db),
):
    return RegencyRainfallClassificationService.list_classification(
        db,
        regency_id=regency_id,
    )


@router.get("/district-hazards")
def get_district_hazards(
    district_id: int | None = Query(default=None),
    regency_id: int | None = Query(default=None),
    kelas_dominan_v2: int | None = Query(default=None),
    landcover_dominan: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return DistrictHazardStatisticService.list_hazard_statistics(
        db,
        district_id=district_id,
        regency_id=regency_id,
        kelas_dominan_v2=kelas_dominan_v2,
        landcover_dominan=landcover_dominan,
    )


@router.get("/district-hazards/district/{district_id}")
def get_district_hazard_by_district(
    district_id: int,
    db: Session = Depends(get_db),
):
    statistic = (
        DistrictHazardStatisticService.get_hazard_statistic_by_district(
            db,
            district_id,
        )
    )

    if statistic is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "District hazard statistic for district "
                f"with id {district_id} not found"
            ),
        )

    return statistic


@router.get("/district-hazards/{statistic_id}")
def get_district_hazard(statistic_id: int, db: Session = Depends(get_db)):
    statistic = DistrictHazardStatisticService.get_hazard_statistic(
        db,
        statistic_id,
    )

    if statistic is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "District hazard statistic with id "
                f"{statistic_id} not found"
            ),
        )

    return statistic


@router.get("/population-exposures")
def get_population_exposures(
    district_id: int | None = Query(default=None),
    regency_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return PopulationExposureService.list_population_exposures(
        db,
        district_id=district_id,
        regency_id=regency_id,
    )


@router.get("/population-exposures/district/{district_id}")
def get_population_exposure_by_district(
    district_id: int,
    db: Session = Depends(get_db),
):
    exposure = (
        PopulationExposureService.get_population_exposure_by_district(
            db,
            district_id,
        )
    )

    if exposure is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "Population exposure for district "
                f"with id {district_id} not found"
            ),
        )

    return exposure


@router.get("/population-exposures/{exposure_id}")
def get_population_exposure(
    exposure_id: int,
    db: Session = Depends(get_db),
):
    exposure = PopulationExposureService.get_population_exposure(
        db,
        exposure_id,
    )

    if exposure is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Population exposure with id {exposure_id} not found"
            ),
        )

    return exposure
