from sqlalchemy.orm import Session

from app.repositories.geography import RiverRepository


class RiverService:
    @staticmethod
    def list_rivers(
        db: Session,
        *,
        name: str | None = None,
        river_type: str | None = None,
        layer_code: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> dict:
        items, total = RiverRepository.get_all(
            db,
            name=name,
            river_type=river_type,
            layer_code=layer_code,
            limit=limit,
            offset=offset,
        )
        return {"items": items, "total": total, "limit": limit, "offset": offset}
