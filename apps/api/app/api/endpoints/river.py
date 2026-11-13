from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.geography import RiverService

router = APIRouter()


@router.get("")
def get_rivers(
    name: str | None = Query(default=None, min_length=1),
    river_type: str | None = Query(default=None, min_length=1),
    layer_code: str | None = Query(default=None, min_length=1),
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    return RiverService.list_rivers(
        db,
        name=name,
        river_type=river_type,
        layer_code=layer_code,
        limit=limit,
        offset=offset,
    )
