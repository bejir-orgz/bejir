from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.params import parse_bbox
from app.db.session import get_db
from app.services.geography import RiverService

router = APIRouter()


@router.get("")
def get_rivers(
    name: str | None = Query(default=None, min_length=1),
    river_type: str | None = Query(default=None, min_length=1),
    layer_code: str | None = Query(default=None, min_length=1),
    bbox: str | None = Query(
        default=None,
        description="minx,miny,maxx,maxy dalam EPSG:4326; hanya sungai yang "
        "beririsan dengan viewport ini yang dikembalikan.",
    ),
    simplify_m: int | None = Query(
        default=None,
        ge=0,
        le=2000,
        description="Toleransi generalisasi dalam meter (EPSG:3857). Default "
        "100 ketika bbox diberikan, tanpa generalisasi tanpa bbox.",
    ),
    limit: int = Query(default=100, ge=1, le=5000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """
    Daftar segmen sungai. Dengan `bbox`, endpoint ini melayani layer peta per
    viewport sehingga 114.304 baris tidak perlu diunduh sekaligus.

    Format `geom` tidak seragam dalam satu halaman: sumber `core.rivers`
    bertipe MULTILINESTRINGZ, tetapi generalisasi `simplify_m` mengubah
    MultiLineString satu bagian menjadi LineString. Jadi `geom` dapat berupa
    `LineString` atau `MultiLineString`, dan koordinatnya membawa nilai Z.
    Klien wajib menerima kedua tipe geometri. Tanpa generalisasi (tanpa `bbox`
    atau `simplify_m=0`) hasilnya selalu `MultiLineString`.
    """
    return RiverService.list_rivers(
        db,
        name=name,
        river_type=river_type,
        layer_code=layer_code,
        bbox=parse_bbox(bbox) if bbox is not None else None,
        simplify_m=simplify_m,
        limit=limit,
        offset=offset,
    )
