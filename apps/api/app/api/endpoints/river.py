from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Response
from sqlalchemy.orm import Session

from app.api.params import parse_bbox
from app.db.session import get_db
from app.schemas.geography.river import RiverRegencySummary
from app.services.geography import RiverService

router = APIRouter()


@router.get("/tiles/{z}/{x}/{y}.mvt", response_class=Response, responses={
    200: {"content": {"application/vnd.mapbox-vector-tile": {}}},
})
def get_river_tile(
    z: Annotated[int, Path(ge=4, le=14)],
    x: Annotated[int, Path(ge=0)],
    y: Annotated[int, Path(ge=0)],
    regency_id: list[Annotated[int, Query(gt=0, le=2147483647)]] = Query(default=[], max_length=27),
    district_id: list[Annotated[int, Query(gt=0, le=2147483647)]] = Query(default=[], max_length=1000),
    db: Session = Depends(get_db),
):
    """PostGIS vector tile, clipped to the selected West Java administrative areas."""
    if x >= 1 << z or y >= 1 << z:
        raise HTTPException(status_code=422, detail="Koordinat tile tidak valid.")
    return Response(
        RiverService.get_tile(db, z=z, x=x, y=y, regency_ids=regency_id, district_ids=district_id),
        media_type="application/vnd.mapbox-vector-tile",
    )


@router.get("/summary", response_model=list[RiverRegencySummary])
def get_river_summary(db: Session = Depends(get_db)):
    """
    Jumlah segmen sungai per kabupaten/kota, tanpa geometri.

    Satu baris untuk setiap kabupaten/kota. Angka memakai irisan batas asli
    (bukan bounding box) dan konsisten dengan `total` pada
    `GET /rivers?regency_id=`.
    """
    return RiverService.get_regency_summary(db)


@router.get("")
def get_rivers(
    name: str | None = Query(default=None, min_length=1),
    river_type: str | None = Query(default=None, min_length=1),
    layer_code: str | None = Query(default=None, min_length=1),
    regency_id: int | None = Query(
        default=None,
        gt=0,
        description="Hanya sungai yang beririsan dengan batas kabupaten/kota "
        "ini (bukan bounding box).",
    ),
    district_id: list[Annotated[int, Query(gt=0)]] = Query(
        default=[],
        max_length=100,
        description="Hanya sungai yang beririsan dengan batas kecamatan ini "
        "(bukan bounding box). Dapat diulang untuk banyak kecamatan, "
        "maksimum 100.",
    ),
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

    Filter `regency_id`/`district_id` memakai irisan geometri batas asli, bukan
    bounding box, sehingga sungai di luar wilayah tidak ikut terhitung.
    `district_id` dapat diulang (maksimum 100) dan hasilnya adalah gabungan
    semua kecamatan yang dipilih. Hasil diurutkan `shape_length` menurun (lalu
    `id`) agar halaman yang terpotong menampilkan sungai terbesar lebih dulu.
    """
    return RiverService.list_rivers(
        db,
        name=name,
        river_type=river_type,
        layer_code=layer_code,
        regency_id=regency_id,
        district_ids=district_id,
        bbox=parse_bbox(bbox) if bbox is not None else None,
        simplify_m=simplify_m,
        limit=limit,
        offset=offset,
    )
