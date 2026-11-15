from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.models.geography.river import River


class RiverRepository:
    @staticmethod
    def get_all(
        db: Session,
        *,
        name: str | None = None,
        river_type: str | None = None,
        layer_code: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> tuple[list[dict], int]:
        statement: Select = select(
            River.id,
            River.fid,
            River.source_id,
            River.name,
            River.river_type,
            River.layer_code,
            River.shape_length,
            func.ST_AsGeoJSON(
                func.ST_Transform(River.geom, 4326)
            ).label("geom"),
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

        import json

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
