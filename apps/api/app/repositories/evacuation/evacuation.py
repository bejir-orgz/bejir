import json
from uuid import UUID, uuid4

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
    def find_augmented_routes(
        db: Session,
        *,
        longitude: float,
        latitude: float,
        destination_limit: int,
        candidate_limit: int,
        snap_tolerance_m: float,
        evacuation_site_id: int | None = None,
    ) -> list[dict]:
        """Route over a request-local, fraction-split copy of the staging graph."""
        # ON COMMIT DROP and connection-local temp tables isolate concurrent requests.
        # The API transaction remains open until route history has been persisted.
        snap = db.execute(text("""
            SELECT edge_id, fraction, distance
            FROM pgr_findCloseEdges(
                'SELECT id, geom FROM routing.road_segments_staging',
                ST_Transform(ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), 32748),
                :tolerance, cap => 1
            )
            ORDER BY distance LIMIT 1
        """), {"lon": longitude, "lat": latitude, "tolerance": snap_tolerance_m}).mappings().first()
        if snap is None:
            raise ValueError("Titik awal berada di luar jarak snap jalan yang dikonfigurasi")

        if evacuation_site_id is not None:
            requested = db.execute(text("""
                SELECT s.id, s.name, s.display_name, s.category, s.district_id,
                       ST_X(s.geom) AS longitude, ST_Y(s.geom) AS latitude,
                       se.edge_id, se.fraction
                FROM core.evacuation_sites s
                JOIN routing.evacuation_site_edges se ON se.evacuation_site_id = s.id
                WHERE s.id = :site_id AND se.is_connected = TRUE
            """), {"site_id": evacuation_site_id}).mappings().first()
            if requested is None:
                raise LookupError("Evacuation site not found or is not connected to the road network")
            sites = [dict(requested)]
        else:
            sites = [dict(row) for row in db.execute(text("""
                SELECT s.id, s.name, s.display_name, s.category, s.district_id,
                       ST_X(s.geom) AS longitude, ST_Y(s.geom) AS latitude,
                       se.edge_id, se.fraction
                FROM core.evacuation_sites s
                JOIN routing.evacuation_site_edges se ON se.evacuation_site_id = s.id
                WHERE s.geom IS NOT NULL AND se.is_connected = TRUE
                ORDER BY ST_Distance(se.snapped_geom,
                    ST_Transform(ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), 32748)), s.id
                LIMIT :candidate_limit
            """), {"lon": longitude, "lat": latitude, "candidate_limit": candidate_limit}).mappings()]
        if not sites:
            return []

        token = uuid4().hex
        points = f"route_points_{token}"
        positions = f"route_positions_{token}"
        augmented = f"route_edges_{token}"
        scope = f"route_scope_{token}"
        db.execute(text(f'''CREATE TEMP TABLE {points} (
            point_key text PRIMARY KEY, edge_id bigint NOT NULL, fraction double precision NOT NULL
        ) ON COMMIT DROP'''))
        db.execute(text(f"INSERT INTO {points} VALUES ('origin', :edge, :fraction)"),
                   {"edge": snap["edge_id"], "fraction": snap["fraction"]})
        db.execute(text(f"INSERT INTO {points} VALUES (:key, :edge, :fraction)"), [
            {"key": f"site:{site['id']}", "edge": site["edge_id"], "fraction": site["fraction"]}
            for site in sites
        ])

        site_ids = [site["id"] for site in sites]
        # Routing is local. Copy/split only the edges inside a box around the
        # origin and candidate sites so the GIST index is usable and the window
        # work runs on a few thousand edges instead of the whole province.
        # The second attempt widens the box when the network forces a detour.
        for margin_m in (5_000, 20_000):
            db.execute(text(
                f"DROP TABLE IF EXISTS {scope}, {positions}, {augmented}"
            ))
            db.execute(text(f'''CREATE TEMP TABLE {scope} ON COMMIT DROP AS
                SELECT ST_Expand(ST_Extent(g), :margin) AS box
                FROM (
                    SELECT se.snapped_geom AS g
                    FROM routing.evacuation_site_edges se
                    WHERE se.evacuation_site_id = ANY(CAST(:site_ids AS bigint[]))
                    UNION ALL
                    SELECT ST_Transform(ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), 32748)
                ) p'''), {
                    "margin": margin_m,
                    "site_ids": site_ids,
                    "lon": longitude,
                    "lat": latitude,
                })
            db.execute(text(f'''CREATE TEMP TABLE {positions} ON COMMIT DROP AS
                WITH unique_positions AS (
                    SELECT DISTINCT edge_id, fraction FROM {points}
                ), mapped AS (
                    SELECT u.edge_id, u.fraction, r.source, r.target,
                           row_number() OVER (ORDER BY u.edge_id, u.fraction) AS ordinal
                    FROM unique_positions u JOIN routing.road_segments_staging r ON r.id=u.edge_id
                ), base AS (
                    SELECT GREATEST(COALESCE(MAX(r.source), 0), COALESCE(MAX(r.target), 0)) AS max_id
                    FROM routing.road_segments_staging r, {scope} s
                    WHERE r.geom && s.box
                )
                SELECT edge_id, fraction,
                       CASE WHEN fraction <= 0 THEN source WHEN fraction >= 1 THEN target
                            ELSE max_id + ordinal END AS node_id
                FROM mapped CROSS JOIN base'''))
            db.execute(text(f'''CREATE TEMP TABLE {augmented} ON COMMIT DROP AS
                WITH cuts AS (
                    SELECT r.id, r.source, r.target, r.cost, r.reverse_cost, r.geom,
                           r.length_m, r.oneway, 0.0::float8 AS fraction
                    FROM routing.road_segments_staging r, {scope} s
                    WHERE r.geom && s.box
                    UNION ALL
                    SELECT r.id, r.source, r.target, r.cost, r.reverse_cost, r.geom,
                           r.length_m, r.oneway, p.fraction
                    FROM routing.road_segments_staging r JOIN {positions} p ON p.edge_id = r.id
                ), ordered AS (
                    SELECT *, lead(fraction, 1, 1.0) OVER (PARTITION BY id ORDER BY fraction) AS next_fraction
                    FROM cuts
                ), segments AS (
                    SELECT id AS road_id, source AS from_node, target AS to_node, geom, length_m, oneway,
                           fraction AS f0, next_fraction AS f1, cost * (next_fraction-fraction) AS cost,
                           CASE WHEN oneway = 'F' THEN -1.0
                                ELSE reverse_cost * (next_fraction-fraction) END AS reverse_cost
                    FROM ordered WHERE next_fraction > fraction
                ), split AS (
                    SELECT s.*, COALESCE(p0.node_id, s.from_node) AS a,
                           COALESCE(p1.node_id, s.to_node) AS b
                    FROM segments s
                    LEFT JOIN {positions} p0 ON p0.edge_id=s.road_id AND p0.fraction=s.f0
                    LEFT JOIN {positions} p1 ON p1.edge_id=s.road_id AND p1.fraction=s.f1
                )
                SELECT row_number() OVER (ORDER BY road_id, f0)::bigint AS id,
                       road_id, a AS source, b AS target, cost, reverse_cost,
                       f0 AS fraction_start, f1 AS fraction_end,
                       length_m * (f1-f0) AS distance_m
                FROM split'''))

            origin_node = db.scalar(text(f"SELECT node_id FROM {positions} p JOIN {points} q USING(edge_id, fraction) WHERE q.point_key='origin'"))
            # Multi-target Dijkstra computes costs and path edges for every candidate once.
            node_ids = db.execute(text(f"SELECT q.point_key, p.node_id FROM {points} q JOIN {positions} p USING(edge_id, fraction) WHERE q.point_key <> 'origin'" )).all()
            graph_sql = f"SELECT id, source, target, cost, reverse_cost FROM {augmented}"
            paths = db.execute(text("""
                SELECT end_vid, seq, node, edge, cost
                FROM pgr_dijkstra(:graph_sql, :start_node, CAST(:end_nodes AS bigint[]), directed := true)
                ORDER BY end_vid, seq
            """), {"graph_sql": graph_sql, "start_node": origin_node,
                    "end_nodes": [node for _, node in node_ids]}).mappings().all()
            paths_by_destination: dict[int, list[dict]] = {}
            for row in paths:
                paths_by_destination.setdefault(row["end_vid"], []).append(dict(row))
            ranked = []
            for key, node in node_ids:
                raw = paths_by_destination.get(node, [])
                path_rows = [row for row in raw if row["edge"] != -1]
                if path_rows:
                    # Pull site metadata in the same order as the candidate list.
                    site = next(item for item in sites if f"site:{item['id']}" == key)
                    ranked.append({"site": site, "raw_path": raw,
                                   "duration_minutes": float(sum(row["cost"] for row in path_rows))})
            if not ranked:
                continue
            ranked.sort(key=lambda route: route["duration_minutes"])
            reachable_count = len(ranked)
            results = []
            for rank, route in enumerate(ranked[:destination_limit], 1):
                raw = route["raw_path"]
                path_rows = [row for row in raw if row["edge"] != -1]
                edge_ids = [row["edge"] for row in path_rows]
                from_nodes = [row["node"] for row in path_rows]
                to_nodes = [raw[index + 1]["node"] for index in range(len(path_rows))]
                path = [dict(row) for row in db.execute(text(f"""
                    WITH traversal AS (
                        SELECT edge_id, from_node, to_node, sequence
                        FROM unnest(CAST(:edge_ids AS bigint[]), CAST(:from_nodes AS bigint[]),
                                    CAST(:to_nodes AS bigint[])) WITH ORDINALITY
                             AS t(edge_id, from_node, to_node, sequence)
                    ), pieces AS (
                        SELECT t.sequence, r.old_id AS road_id, e.distance_m,
                               CASE WHEN t.from_node = e.source
                                    THEN ST_LineSubstring(r.geom, e.fraction_start, e.fraction_end)
                                    ELSE ST_Reverse(ST_LineSubstring(r.geom, e.fraction_start, e.fraction_end))
                               END AS geom,
                               r.name
                        FROM traversal t JOIN {augmented} e ON e.id=t.edge_id
                        JOIN routing.road_segments_staging r ON r.id=e.road_id
                    )
                    SELECT pieces.sequence, pieces.road_id, pieces.distance_m, pieces.name,
                           ST_AsGeoJSON(ST_Transform(pieces.geom,4326)) AS geometry,
                           ST_AsGeoJSON(ST_Transform(route.geom,4326)) AS route_geometry
                    FROM pieces CROSS JOIN (
                        SELECT ST_MakeLine(geom ORDER BY sequence) AS geom FROM pieces
                    ) route ORDER BY pieces.sequence
                """), {"edge_ids": edge_ids, "from_nodes": from_nodes, "to_nodes": to_nodes}).mappings().all()]
                route_geometry = json.loads(path[0]["route_geometry"]) if path and path[0]["route_geometry"] else None
                if not route_geometry or route_geometry.get("type") != "LineString" or len(route_geometry.get("coordinates", [])) < 2:
                    continue
                route.update({"rank": rank, "reachable_count": reachable_count,
                              "distance_m": sum(float(item["distance_m"]) for item in path),
                              "geometry": route_geometry, "path": path})
                for sequence, item in enumerate(path, 1):
                    item["sequence"] = sequence
                    item["geometry"] = json.loads(item["geometry"]) if item["geometry"] else None
                results.append(route)
            if results:
                return results
        return []

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
