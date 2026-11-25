import logging
import math

from sqlalchemy.exc import DBAPIError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.evacuation import RouteDestination, RouteSegment
from app.repositories.evacuation import EvacuationRepository
from app.schemas.evacuation import (
    EvacuationSiteDetailResponse,
    EvacuationSiteListResponse,
    EvacuationSiteNearbyResponse,
    RoadSegmentListResponse,
    RouteResponse,
    RouteSegmentResponse,
)

logger = logging.getLogger(__name__)


class RouteNotFoundError(Exception):
    pass


class RoutingUnavailableError(Exception):
    pass


class InvalidRouteRequestError(Exception):
    pass


class EvacuationService:
    @staticmethod
    def list_sites(
        db: Session,
        *,
        district_id: int | None,
        limit: int,
        offset: int,
    ) -> EvacuationSiteListResponse:
        items, total = EvacuationRepository.list_sites(
            db,
            district_id=district_id,
            limit=limit,
            offset=offset,
        )
        return EvacuationSiteListResponse(
            items=items,
            total=total,
            limit=limit,
            offset=offset,
        )

    @staticmethod
    def get_site(db: Session, site_id: int) -> EvacuationSiteDetailResponse | None:
        site = EvacuationRepository.get_site(db, site_id)
        return EvacuationSiteDetailResponse(**site) if site is not None else None

    @staticmethod
    def find_nearby_sites(
        db: Session,
        *,
        longitude: float,
        latitude: float,
        radius_m: float,
        limit: int,
    ) -> list[EvacuationSiteNearbyResponse]:
        return [
            EvacuationSiteNearbyResponse(**site)
            for site in EvacuationRepository.find_nearby_sites(
                db,
                longitude=longitude,
                latitude=latitude,
                radius_m=radius_m,
                limit=limit,
            )
        ]

    @staticmethod
    def list_roads(
        db: Session,
        *,
        road_class: str | None,
        limit: int,
        offset: int,
    ) -> RoadSegmentListResponse:
        items, total = EvacuationRepository.list_roads(
            db,
            road_class=road_class,
            limit=limit,
            offset=offset,
        )
        return RoadSegmentListResponse(
            items=items,
            total=total,
            limit=limit,
            offset=offset,
        )

    @staticmethod
    def find_route(
        db: Session,
        *,
        origin_longitude: float,
        origin_latitude: float,
        evacuation_site_id: int | None,
        travel_mode: str,
        limit: int = 3,
    ) -> RouteResponse:
        if (
            not math.isfinite(origin_longitude)
            or not math.isfinite(origin_latitude)
            or not -180 <= origin_longitude <= 180
            or not -90 <= origin_latitude <= 90
        ):
            raise InvalidRouteRequestError("Koordinat titik awal harus berupa nilai longitude/latitude EPSG:4326 yang valid")
        route_request = EvacuationRepository.create_route_request(
            db,
            longitude=origin_longitude,
            latitude=origin_latitude,
            travel_mode=travel_mode,
        )
        try:
            routes = EvacuationRepository.find_augmented_routes(
                db,
                longitude=origin_longitude,
                latitude=origin_latitude,
                destination_limit=1 if evacuation_site_id is not None else limit,
                candidate_limit=max(settings.ROUTING_MAX_CANDIDATE_SITES, limit),
                snap_tolerance_m=settings.ROUTING_ORIGIN_SNAP_TOLERANCE_M,
                evacuation_site_id=evacuation_site_id,
            )
        except LookupError as error:
            EvacuationRepository.set_route_request_status(route_request, status="failed", error_message=str(error))
            db.commit()
            raise RouteNotFoundError(str(error)) from error
        except ValueError as error:
            EvacuationRepository.set_route_request_status(route_request, status="failed", error_message=str(error))
            db.commit()
            raise InvalidRouteRequestError(str(error)) from error
        except DBAPIError as error:
            logger.error(
                "Evacuation routing database operation failed (SQLSTATE %s): %s",
                getattr(error.orig, "sqlstate", None),
                error.orig,
            )
            db.rollback()
            failed_request = EvacuationRepository.create_route_request(
                db,
                longitude=origin_longitude,
                latitude=origin_latitude,
                travel_mode=travel_mode,
            )
            EvacuationRepository.set_route_request_status(
                failed_request,
                status="failed",
                error_message="pgRouting is unavailable or the road network is not routable.",
            )
            db.commit()
            raise RoutingUnavailableError(
                "pgRouting is unavailable or the road network is not routable."
            ) from error

        if not routes:
            EvacuationRepository.set_route_request_status(
                route_request,
                status="failed",
                error_message="No connected evacuation site is reachable over the road network.",
            )
            db.commit()
            raise RouteNotFoundError(
                "No connected evacuation site is reachable over the road network."
            )
        response_routes = []
        for route in routes:
            site = route["site"]
            destination = RouteDestination(
                route_request_id=route_request.id,
                evacuation_site_id=site["id"],
                distance_m=route["distance_m"],
                duration_minutes=route["duration_minutes"],
                rank=route["rank"],
            )
            db.add(destination)
            db.flush()
            db.add_all([RouteSegment(
                route_destination_id=destination.id,
                road_segment_id=segment["road_id"],
                sequence=segment["sequence"],
                distance_m=segment["distance_m"],
            ) for segment in route["path"]])
            response_routes.append({
                "evacuation_site": {
                    "id": site["id"], "name": site["display_name"] or site["name"],
                    "category": site["category"], "district_id": site["district_id"],
                    "longitude": site["longitude"], "latitude": site["latitude"],
                },
                "distance_m": route["distance_m"],
                "duration_minutes": route["duration_minutes"],
                "rank": route["rank"], "geometry": route["geometry"],
                "segment_count": len(route["path"]),
                "segments": [RouteSegmentResponse(
                    sequence=segment["sequence"], road_segment_id=segment["road_id"],
                    name=segment["name"], distance_m=segment["distance_m"],
                    geometry=segment["geometry"],
                ) for segment in route["path"]],
            })
        EvacuationRepository.set_route_request_status(route_request, status="completed")
        db.commit()

        return RouteResponse(
            route_request_id=route_request.id,
            origin_longitude=origin_longitude,
            origin_latitude=origin_latitude,
            travel_mode=travel_mode,
            reachable_destinations=routes[0]["reachable_count"],
            routes=response_routes,
            evacuation_site=response_routes[0]["evacuation_site"],
            distance_m=response_routes[0]["distance_m"],
            duration_minutes=response_routes[0]["duration_minutes"],
            segments=response_routes[0]["segments"],
        )
