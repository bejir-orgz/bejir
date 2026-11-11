import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.evacuation import RouteRequest, RouteResponse
from app.services.evacuation import (
    EvacuationService,
    InvalidRouteRequestError,
    RouteNotFoundError,
    RoutingUnavailableError,
)

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/sites")
def get_sites(
    district_id: int | None = Query(default=None, gt=0),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    return EvacuationService.list_sites(
        db,
        district_id=district_id,
        limit=limit,
        offset=offset,
    )


@router.get("/sites/nearby")
def get_nearby_sites(
    longitude: float = Query(ge=-180, le=180),
    latitude: float = Query(ge=-90, le=90),
    radius_m: float = Query(default=5_000, gt=0, le=50_000),
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return EvacuationService.find_nearby_sites(
        db,
        longitude=longitude,
        latitude=latitude,
        radius_m=radius_m,
        limit=limit,
    )


@router.get("/sites/{site_id}")
def get_site(site_id: int, db: Session = Depends(get_db)):
    site = EvacuationService.get_site(db, site_id)
    if site is None:
        raise HTTPException(status_code=404, detail="Evacuation site not found")
    return site


@router.get("/roads")
def get_roads(
    road_class: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    return EvacuationService.list_roads(
        db,
        road_class=road_class,
        limit=limit,
        offset=offset,
    )


@router.post("/routes", response_model=RouteResponse, status_code=status.HTTP_201_CREATED)
def create_route(payload: RouteRequest, db: Session = Depends(get_db)):
    try:
        return EvacuationService.find_route(db, **payload.model_dump())
    except RouteNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except RoutingUnavailableError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except InvalidRouteRequestError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except Exception as error:
        logger.exception("Unexpected evacuation routing failure")
        raise HTTPException(status_code=500, detail="Unable to calculate evacuation routes") from error
