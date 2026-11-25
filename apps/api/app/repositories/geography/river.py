import json

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session
from sqlalchemy.sql.elements import ColumnElement

from app.models.geography.district import District
from app.models.geography.regency import Regency
from app.models.geography.river import River


class RiverRepository:
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
    def get_all(
        db: Session,
        *,
        name: str | None = None,
        river_type: str | None = None,
        layer_code: str | None = None,
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

        rows = db.execute(
            statement.order_by(River.id).limit(limit).offset(offset)
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
