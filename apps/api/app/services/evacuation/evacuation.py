from sqlalchemy.exc import DBAPIError
from sqlalchemy.orm import Session

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


class RouteNotFoundError(Exception):
    pass


class RoutingUnavailableError(Exception):
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
        evacuation_site_id: int,
        travel_mode: str,
    ) -> RouteResponse:
        site = EvacuationRepository.get_site(db, evacuation_site_id)
        if site is None:
            raise RouteNotFoundError("Evacuation site not found")

        route_request = EvacuationRepository.create_route_request(
            db,
            longitude=origin_longitude,
            latitude=origin_latitude,
            travel_mode=travel_mode,
        )
        start_node = EvacuationRepository.nearest_road_node(
            db,
            longitude=origin_longitude,
            latitude=origin_latitude,
        )
        end_node = EvacuationRepository.nearest_road_node(
            db,
            longitude=site["longitude"],
            latitude=site["latitude"],
        )
        if start_node is None or end_node is None:
            EvacuationRepository.set_route_request_status(
                route_request,
                status="failed",
                error_message="No routable road node is available for this route.",
            )
            db.commit()
            raise RoutingUnavailableError(
                "The road network topology has not been prepared for routing."
            )

        try:
            path = EvacuationRepository.find_shortest_path(
                db,
                start_node=start_node,
                end_node=end_node,
            )
        except DBAPIError as error:
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

        if not path:
            EvacuationRepository.set_route_request_status(
                route_request,
                status="failed",
                error_message="No route connects the origin to the evacuation site.",
            )
            db.commit()
            raise RouteNotFoundError(
                "No route connects the origin to the evacuation site."
            )

        distance_m = sum(segment["distance_m"] for segment in path)
        speeds_available = all(
            segment["speed_kmh"] is not None and segment["speed_kmh"] > 0
            for segment in path
        )
        duration_minutes = (
            sum(
                segment["distance_m"] / (segment["speed_kmh"] * 1000) * 60
                for segment in path
            )
            if speeds_available
            else None
        )
        destination = RouteDestination(
            route_request_id=route_request.id,
            evacuation_site_id=evacuation_site_id,
            distance_m=distance_m,
            duration_minutes=duration_minutes,
            rank=1,
        )
        db.add(destination)
        db.flush()
        db.add_all(
            [
                RouteSegment(
                    route_destination_id=destination.id,
                    road_segment_id=segment["road_segment_id"],
                    sequence=segment["sequence"] + 1,
                    distance_m=segment["distance_m"],
                )
                for segment in path
            ]
        )
        EvacuationRepository.set_route_request_status(route_request, status="completed")
        db.commit()

        return RouteResponse(
            route_request_id=route_request.id,
            evacuation_site=site,
            distance_m=distance_m,
            duration_minutes=duration_minutes,
            segments=[
                RouteSegmentResponse(
                    sequence=segment["sequence"] + 1,
                    road_segment_id=segment["road_segment_id"],
                    name=segment["name"],
                    distance_m=segment["distance_m"],
                    geometry=segment["geometry"],
                )
                for segment in path
            ],
        )
