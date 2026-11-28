import json

from sqlalchemy import Select, func, select, text
from sqlalchemy.orm import Session, aliased
from sqlalchemy.sql.elements import ColumnElement

from app.models.geography.district import District
from app.models.geography.regency import Regency
from app.models.geography.river import River

# A region boundary is split into small tiles for filtering. Testing the whole
# boundary in one ST_Intersects is exact but very slow for large regencies
# (10k+ vertices): the GIST bbox admits too many rivers and each exact test
# walks the full polygon. Tiles keep both the candidate set and the exact test
# small while preserving the original boundary geometry.
_BOUNDARY_TILE_VERTICES = 2048


def _intersecting_river_ids(model, boundary_ids: list[int]) -> Select:
    tiles = (
        select(
            func.ST_Subdivide(
                func.ST_Transform(model.geom, 3857),
                _BOUNDARY_TILE_VERTICES,
            ).label("tile")
        )
        .where(model.id.in_(boundary_ids))
        .subquery()
    )
    river = aliased(River)
    return (
        select(river.id)
        .join(tiles, func.ST_Intersects(river.geom, tiles.c.tile))
        .distinct()
    )


class RiverRepository:
    @staticmethod
    def get_tile(
        db: Session, *, z: int, x: int, y: int,
        regency_ids: list[int], district_ids: list[int],
    ) -> bytes:
        # The buffer matches 64 MVT units out of the 4096-unit extent.
        # Keep the river geometry in EPSG:3857 so the spatial index can filter the tile.
        statement = text("""
            WITH tile AS (
                SELECT ST_TileEnvelope(:z, :x, :y) AS envelope,
                       ST_TileEnvelope(:z, :x, :y, margin => 0.015625) AS buffered
            ), scope AS (
                SELECT ST_Union(ST_Intersection(ST_Transform(region.geom, 3857), tile.buffered)) AS geom
                FROM tile
                CROSS JOIN LATERAL (
                    SELECT geom FROM core.regency
                    WHERE id = ANY(CAST(:regency_ids AS bigint[]))
                      AND geom && ST_Transform(tile.buffered, 4326)
                    UNION ALL
                    SELECT geom FROM core.districts
                    WHERE id = ANY(CAST(:district_ids AS bigint[]))
                      AND geom && ST_Transform(tile.buffered, 4326)
                ) AS region
            ), lines AS (
                SELECT r.id, r.name, r.river_type,
                       ST_AsMVTGeom(
                           CASE WHEN :scoped THEN ST_CollectionExtract(ST_Intersection(r.geom, scope.geom), 2)
                                ELSE r.geom END,
                           tile.envelope, 4096, 64
                       ) AS geom
                FROM tile CROSS JOIN scope
                JOIN core.rivers r ON r.geom && tile.buffered
                WHERE NOT :scoped OR ST_Intersects(r.geom, scope.geom)
            )
            SELECT ST_AsMVT(lines, 'rivers', 4096, 'geom', 'id')
            FROM lines WHERE geom IS NOT NULL AND ST_Dimension(geom) = 1
        """)
        tile = db.scalar(statement, {
            "z": z, "x": x, "y": y, "regency_ids": regency_ids,
            "district_ids": district_ids, "scoped": bool(regency_ids or district_ids),
        })
        return bytes(tile) if tile else b""

    @staticmethod
    def get_assistant_summary(
        db: Session, *, location_filter: ColumnElement[bool] | None = None,
    ) -> dict:
        segments = select(River.id, River.name, River.river_type)
        if location_filter is not None:
            # Transform the small boundary set, keeping the river geometry index usable.
            matching_boundary = (
                select(District.id)
                .join(Regency, Regency.id == District.regency_id)
                .where(location_filter)
                .where(func.ST_Intersects(River.geom, func.ST_Transform(District.geom, 3857)))
                .correlate(River)
                .exists()
            )
            segments = segments.where(matching_boundary)
        scoped = segments.subquery()
        total = db.scalar(select(func.count()).select_from(scoped)) or 0
        groups = db.execute(
            select(scoped.c.name, scoped.c.river_type, func.count().label("segment_count"))
            .group_by(scoped.c.name, scoped.c.river_type)
            .order_by(func.count().desc(), scoped.c.name.asc().nullslast(), scoped.c.river_type.asc().nullslast())
            .limit(8)
        ).mappings().all()
        return {
            "segment_count": total,
            "top_name_type_groups": [dict(row) for row in groups],
            "groups_limit": 8,
        }

    @staticmethod
    def get_regency_summary(db: Session) -> list[dict]:
        """River segment count intersecting each regency boundary."""
        tiles = (
            select(
                Regency.id.label("regency_id"),
                func.ST_Subdivide(
                    func.ST_Transform(Regency.geom, 3857),
                    _BOUNDARY_TILE_VERTICES,
                ).label("tile"),
            )
            .cte("regency_tiles")
        )
        statement = (
            select(
                Regency.id.label("regency_id"),
                Regency.name.label("regency_name"),
                func.count(func.distinct(River.id)).label("total"),
            )
            .select_from(Regency)
            .outerjoin(tiles, tiles.c.regency_id == Regency.id)
            .outerjoin(River, func.ST_Intersects(River.geom, tiles.c.tile))
            .group_by(Regency.id, Regency.name)
            .order_by(Regency.id)
        )
        return [dict(row) for row in db.execute(statement).mappings().all()]

    @staticmethod
    def get_all(
        db: Session,
        *,
        name: str | None = None,
        river_type: str | None = None,
        layer_code: str | None = None,
        regency_id: int | None = None,
        district_ids: list[int] | None = None,
        bbox: tuple[float, float, float, float] | None = None,
        simplify_m: int | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> tuple[list[dict], int]:
        geometry = River.geom
        if simplify_m:
            # Rivers already live in EPSG:3857, so the tolerance is metres.
            geometry = func.ST_SimplifyPreserveTopology(River.geom, simplify_m)

        transformed = func.ST_Transform(geometry, 4326)
        # Viewport responses round to 6 decimals (~0.11 m) to keep payloads small.
        geojson = (
            func.ST_AsGeoJSON(transformed, 6)
            if bbox is not None
            else func.ST_AsGeoJSON(transformed)
        )

        statement: Select = select(
            River.id,
            River.fid,
            River.source_id,
            River.name,
            River.river_type,
            River.layer_code,
            River.shape_length,
            geojson.label("geom"),
        )

        if bbox is not None:
            minx, miny, maxx, maxy = bbox
            statement = statement.where(
                func.ST_Intersects(
                    River.geom,
                    func.ST_Transform(
                        func.ST_MakeEnvelope(minx, miny, maxx, maxy, 4326),
                        3857,
                    ),
                )
            )
        # Region filters match the real boundary (not its bounding box), applied
        # as a tiled semi-join so each river is returned once.
        if regency_id is not None:
            statement = statement.where(
                River.id.in_(_intersecting_river_ids(Regency, [regency_id]))
            )
        if district_ids:
            statement = statement.where(
                River.id.in_(_intersecting_river_ids(District, district_ids))
            )
        if name is not None:
            statement = statement.where(River.name.ilike(f"%{name}%"))
        if river_type is not None:
            statement = statement.where(River.river_type == river_type)
        if layer_code is not None:
            statement = statement.where(River.layer_code == layer_code)

        count_statement = select(func.count()).select_from(
            statement.order_by(None).subquery()
        )
        total = db.scalar(count_statement) or 0

        # Largest rivers first so a truncated viewport shows the most
        # significant segments instead of a contiguous id range. id keeps
        # pagination deterministic when lengths tie.
        rows = db.execute(
            statement.order_by(
                River.shape_length.desc().nullslast(),
                River.id,
            ).limit(limit).offset(offset)
        ).all()

        items = [
            {
                "id": row.id,
                "fid": row.fid,
                "source_id": row.source_id,
                "name": row.name,
                "river_type": row.river_type,
                "layer_code": row.layer_code,
                "shape_length": row.shape_length,
                "geom": json.loads(row.geom) if row.geom else None,
            }
            for row in rows
        ]
        return items, total
