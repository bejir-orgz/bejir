import json
from uuid import UUID

from geoalchemy2 import Geography, WKTElement
from sqlalchemy import cast, func, select, text
from sqlalchemy.orm import Session

from app.models.evacuation import EvacuationSite, RoadSegment, RouteRequest


class EvacuationRepository:
    @staticmethod
    def _point(longitude: float, latitude: float) -> WKTElement:
        return WKTElement(f"POINT({longitude} {latitude})", srid=4326)

    @staticmethod
    def list_sites(
        db: Session,
        *,
        district_id: int | None,
        limit: int,
        offset: int,
    ) -> tuple[list[dict], int]:
        statement = select(
            EvacuationSite,
            func.ST_X(EvacuationSite.geom).label("longitude"),
            func.ST_Y(EvacuationSite.geom).label("latitude"),
        ).where(EvacuationSite.geom.is_not(None))
        if district_id is not None:
            statement = statement.where(EvacuationSite.district_id == district_id)

        total = db.scalar(select(func.count()).select_from(statement.subquery())) or 0
        rows = db.execute(
            statement.order_by(EvacuationSite.name.asc().nullslast(), EvacuationSite.id)
            .limit(limit)
            .offset(offset)
        ).all()
        return [EvacuationRepository._site_row(row) for row in rows], total

    @staticmethod
    def get_site(db: Session, site_id: int) -> dict | None:
        row = db.execute(
            select(
                EvacuationSite,
                func.ST_X(EvacuationSite.geom).label("longitude"),
                func.ST_Y(EvacuationSite.geom).label("latitude"),
            ).where(EvacuationSite.id == site_id, EvacuationSite.geom.is_not(None))
        ).one_or_none()
        return EvacuationRepository._site_row(row) if row is not None else None

    @staticmethod
    def find_nearby_sites(
        db: Session,
        *,
        longitude: float,
        latitude: float,
        radius_m: float,
        limit: int,
    ) -> list[dict]:
        point_geometry = func.ST_SetSRID(
            func.ST_MakePoint(longitude, latitude),
            4326,
        )
        site_geography = cast(EvacuationSite.geom, Geography)
        point_geography = cast(point_geometry, Geography)
        distance = func.ST_Distance(site_geography, point_geography).label("distance_m")
        rows = db.execute(
            select(
                EvacuationSite,
                func.ST_X(EvacuationSite.geom).label("longitude"),
                func.ST_Y(EvacuationSite.geom).label("latitude"),
                distance,
            )
            .where(
                EvacuationSite.geom.is_not(None),
                func.ST_DWithin(site_geography, point_geography, radius_m),
            )
            .order_by(distance, EvacuationSite.id)
            .limit(limit)
        ).all()
        return [EvacuationRepository._site_row(row, include_distance=True) for row in rows]

    @staticmethod
    def list_roads(
        db: Session,
        *,
        road_class: str | None,
        limit: int,
        offset: int,
    ) -> tuple[list[dict], int]:
        statement = select(
            RoadSegment,
            func.ST_AsGeoJSON(RoadSegment.geom).label("geometry"),
        )
        if road_class is not None:
            statement = statement.where(RoadSegment.road_class == road_class)

        total = db.scalar(select(func.count()).select_from(statement.subquery())) or 0
        rows = db.execute(statement.order_by(RoadSegment.id).limit(limit).offset(offset)).all()
        return [EvacuationRepository._road_row(row) for row in rows], total

    @staticmethod
    def create_route_request(
        db: Session,
        *,
        longitude: float,
        latitude: float,
        travel_mode: str,
    ) -> RouteRequest:
        route_request = RouteRequest(
            origin=EvacuationRepository._point(longitude, latitude),
            travel_mode=travel_mode,
            status="pending",
        )
        db.add(route_request)
        db.flush()
        return route_request

    @staticmethod
    def nearest_road_node(db: Session, *, longitude: float, latitude: float) -> int | None:
        statement = text("""
            SELECT CASE
                WHEN ST_Distance(
                    ST_StartPoint(geom)::geography,
                    ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
                ) <= ST_Distance(
                    ST_EndPoint(geom)::geography,
                    ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
                ) THEN source_node
                ELSE target_node
            END AS node_id
            FROM core.road_segments
            WHERE geom IS NOT NULL
              AND source_node IS NOT NULL
              AND target_node IS NOT NULL
              AND cost IS NOT NULL
            ORDER BY geom <-> ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)
            LIMIT 1
        """)
        return db.scalar(statement, {"longitude": longitude, "latitude": latitude})

    @staticmethod
    def find_shortest_path(
        db: Session,
        *,
        start_node: int,
        end_node: int,
    ) -> list[dict]:
        statement = text("""
            WITH path AS (
                SELECT seq, edge
                FROM pgr_dijkstra(
                    $$
                    SELECT id, source_node AS source, target_node AS target,
                           cost, reverse_cost::double precision AS reverse_cost
                    FROM core.road_segments
                    WHERE source_node IS NOT NULL
                      AND target_node IS NOT NULL
                      AND cost IS NOT NULL
                    $$,
                    :start_node,
                    :end_node,
                    directed := true
                )
                WHERE edge <> -1
            )
            SELECT path.seq AS sequence,
                   road.id AS road_segment_id,
                   road.name,
                   COALESCE(road.length_m, 0) AS distance_m,
                   road.speed_kmh,
                   ST_AsGeoJSON(road.geom) AS geometry
            FROM path
            JOIN core.road_segments AS road ON road.id = path.edge
            ORDER BY path.seq
        """)
        rows = db.execute(statement, {"start_node": start_node, "end_node": end_node}).mappings()
        return [
            {
                **dict(row),
                "geometry": json.loads(row["geometry"]) if row["geometry"] else None,
            }
            for row in rows
        ]

    @staticmethod
    def set_route_request_status(
        route_request: RouteRequest,
        *,
        status: str,
        error_message: str | None = None,
    ) -> None:
        route_request.status = status
        route_request.error_message = error_message

    @staticmethod
    def _site_row(row, *, include_distance: bool = False) -> dict:
        site = row[0]
        result = {
            "id": site.id,
            "fid": site.fid,
            "osm_id": site.osm_id,
            "name": site.name,
            "osm_type": site.osm_type,
            "category": site.category,
            "source": site.source,
            "code_kec": site.code_kec,
            "display_name": site.display_name,
            "district_id": site.district_id,
            "longitude": row.longitude,
            "latitude": row.latitude,
        }
        if include_distance:
            result["distance_m"] = float(row.distance_m)
        return result

    @staticmethod
    def _road_row(row) -> dict:
        road = row[0]
        return {
            "id": road.id,
            "road_class": road.road_class,
            "name": road.name,
            "oneway": road.oneway,
            "speed_kmh": road.speed_kmh,
            "length_m": road.length_m,
            "geometry": json.loads(row.geometry) if row.geometry else None,
        }
