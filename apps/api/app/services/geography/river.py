from sqlalchemy.orm import Session

from app.repositories.geography import RiverRepository
from app.schemas.geography.river import RiverRegencySummary

# Viewport default matches /api/v1/geography/boundaries.
VIEWPORT_SIMPLIFY_M = 100


class RiverService:
    @staticmethod
    def get_tile(
        db: Session, *, z: int, x: int, y: int,
        regency_ids: list[int], district_ids: list[int],
    ) -> bytes:
        return RiverRepository.get_tile(
            db, z=z, x=x, y=y, regency_ids=regency_ids, district_ids=district_ids,
        )

    @staticmethod
    def get_regency_summary(db: Session) -> list[RiverRegencySummary]:
        return [
            RiverRegencySummary(**row)
            for row in RiverRepository.get_regency_summary(db)
        ]

    @staticmethod
    def list_rivers(
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
    ) -> dict:
        if simplify_m is None:
            simplify_m = VIEWPORT_SIMPLIFY_M if bbox is not None else None

        items, total = RiverRepository.get_all(
            db,
            name=name,
            river_type=river_type,
            layer_code=layer_code,
            regency_id=regency_id,
            district_ids=district_ids,
            bbox=bbox,
            simplify_m=simplify_m,
            limit=limit,
            offset=offset,
        )
        return {
            "items": items,
            "total": total,
            "limit": limit,
            "offset": offset,
            "truncated": total > offset + limit,
            "bbox": list(bbox) if bbox is not None else None,
            "simplify_m": simplify_m,
        }
