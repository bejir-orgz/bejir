
import json
import math
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, literal, select
from sqlalchemy.orm import Session

from app.db.session import get_db

from app.models.geography.province import Province
from app.models.geography.regency import Regency
from app.models.geography.district import District
from app.models.geography.village import Village
from app.repositories.geography import GeographyRepository
from app.schemas.geography.catalog import AdministrativeCatalog

router = APIRouter()


@router.get("/catalog", response_model=AdministrativeCatalog)
def get_catalog(db: Session = Depends(get_db)):
    return GeographyRepository.get_catalog(db, "32")


# =========================================================
# HELPERS
# =========================================================

def geometry_to_geojson(geometry):
    """
    Convert PostGIS geometry JSON string into GeoJSON dictionary.
    """
    if geometry is None:
        return None

    return json.loads(geometry)


def paginate_query(statement, limit: int, offset: int):
    """
    Apply pagination to SQLAlchemy statement.
    """
    return statement.limit(limit).offset(offset)


def parse_bbox(value: str) -> tuple[float, float, float, float]:
    """
    Parse a comma-separated minx,miny,maxx,maxy bounding box in EPSG:4326.
    """
    try:
        parts = [part.strip() for part in value.split(",")]
        if len(parts) != 4:
            raise ValueError
        minx, miny, maxx, maxy = (float(part) for part in parts)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=422,
            detail="bbox harus berupa minx,miny,maxx,maxy dalam EPSG:4326.",
        )

    if not all(math.isfinite(number) for number in (minx, miny, maxx, maxy)):
        raise HTTPException(
            status_code=422,
            detail="bbox harus berisi angka berhingga.",
        )
    if not (-180 <= minx < maxx <= 180 and -90 <= miny < maxy <= 90):
        raise HTTPException(
            status_code=422,
            detail="bbox di luar EPSG:4326 atau nilai min tidak lebih kecil dari maks.",
        )

    return minx, miny, maxx, maxy


# =========================================================
# PROVINCES
# =========================================================

@router.get("/provinces")
def get_provinces(
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    statement = select(
        Province.id,
        Province.code,
        Province.name,
    ).order_by(Province.name, Province.id)

    statement = paginate_query(statement, limit, offset)

    results = db.execute(statement).all()

    return [
        {
            "id": row.id,
            "code": row.code,
            "name": row.name,
        }
        for row in results
    ]


# =========================================================
# REGENCIES
# =========================================================

@router.get("/regencies")
def get_regencies(
    province_code: str | None = Query(default=None),
    include_geometry: bool = Query(default=True),
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    statement = select(
        Regency.id,
        Regency.code,
        Regency.name,
        Regency.province_code,
        (func.ST_AsGeoJSON(Regency.geom) if include_geometry else literal(None)).label("geom"),
    )

    if province_code is not None:
        statement = statement.where(
            Regency.province_code == province_code
        )

    statement = statement.order_by(Regency.name, Regency.id)
    statement = paginate_query(statement, limit, offset)

    results = db.execute(statement).all()

    return [
        {
            "id": row.id,
            "code": row.code,
            "name": row.name,
            "province_code": row.province_code,
            "geom": geometry_to_geojson(row.geom),
        }
        for row in results
    ]


@router.get("/regencies/{regency_id}")
def get_regency(
    regency_id: int,
    db: Session = Depends(get_db),
):
    statement = select(
        Regency.id,
        Regency.code,
        Regency.name,
        Regency.province_code,
        func.ST_AsGeoJSON(Regency.geom).label("geom"),
    ).where(
        Regency.id == regency_id
    )

    row = db.execute(statement).first()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Regency not found",
        )

    return {
        "id": row.id,
        "code": row.code,
        "name": row.name,
        "province_code": row.province_code,
        "geom": geometry_to_geojson(row.geom),
    }


# =========================================================
# DISTRICTS
# =========================================================

@router.get("/districts")
def get_districts(
    regency_id: int | None = Query(default=None),
    include_geometry: bool = Query(default=True),
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    statement = select(
        District.id,
        District.code,
        District.name,
        District.regency_id,
        (func.ST_AsGeoJSON(District.geom) if include_geometry else literal(None)).label("geom"),
    )

    if regency_id is not None:
        statement = statement.where(
            District.regency_id == regency_id
        )

    statement = statement.order_by(District.name, District.id)
    statement = paginate_query(statement, limit, offset)

    results = db.execute(statement).all()

    return [
        {
            "id": row.id,
            "code": row.code,
            "name": row.name,
            "regency_id": row.regency_id,
            "geom": geometry_to_geojson(row.geom),
        }
        for row in results
    ]


@router.get("/districts/{district_id}")
def get_district(
    district_id: int,
    db: Session = Depends(get_db),
):
    statement = select(
        District.id,
        District.code,
        District.name,
        District.regency_id,
        func.ST_AsGeoJSON(District.geom).label("geom"),
    ).where(
        District.id == district_id
    )

    row = db.execute(statement).first()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="District not found",
        )

    return {
        "id": row.id,
        "code": row.code,
        "name": row.name,
        "regency_id": row.regency_id,
        "geom": geometry_to_geojson(row.geom),
    }


# =========================================================
# VILLAGES
# =========================================================

@router.get("/villages")
def get_villages(
    district_id: int | None = Query(default=None),
    include_geometry: bool = Query(default=True),
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    statement = select(
        Village.id,
        Village.code,
        Village.name,
        Village.district_id,
        (func.ST_AsGeoJSON(Village.geom) if include_geometry else literal(None)).label("geom"),
    )

    if district_id is not None:
        statement = statement.where(
            Village.district_id == district_id
        )

    statement = statement.order_by(Village.name, Village.id)
    statement = paginate_query(statement, limit, offset)

    results = db.execute(statement).all()

    return [
        {
            "id": row.id,
            "code": row.code,
            "name": row.name,
            "district_id": row.district_id,
            "geom": geometry_to_geojson(row.geom),
        }
        for row in results
    ]


@router.get("/villages/{village_id}")
def get_village(
    village_id: int,
    db: Session = Depends(get_db),
):
    statement = select(
        Village.id,
        Village.code,
        Village.name,
        Village.district_id,
        func.ST_AsGeoJSON(Village.geom).label("geom"),
    ).where(
        Village.id == village_id
    )

    row = db.execute(statement).first()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Village not found",
        )

    return {
        "id": row.id,
        "code": row.code,
        "name": row.name,
        "district_id": row.district_id,
        "geom": geometry_to_geojson(row.geom),
    }


# =========================================================
# BBOX BOUNDARIES
# =========================================================

@router.get("/boundaries")
def get_boundaries(
    level: Literal["district", "village"] = Query(default="district"),
    bbox: str = Query(
        description="minx,miny,maxx,maxy dalam EPSG:4326",
    ),
    simplify_m: int = Query(default=100, ge=0, le=2000),
    limit: int = Query(default=2000, ge=1, le=5000),
    db: Session = Depends(get_db),
):
    """
    Serve simplified administrative geometry for a viewport.

    This avoids shipping the full district or village boundary set to the
    browser. Geometry is generalized after projection to EPSG:3857 so the
    tolerance is expressed in metres, then returned as EPSG:4326 GeoJSON.
    """
    minx, miny, maxx, maxy = parse_bbox(bbox)
    envelope = func.ST_MakeEnvelope(minx, miny, maxx, maxy, 4326)

    if level == "district":
        model = District
        parent_column = District.regency_id
        parent_key = "regency_id"
    else:
        model = Village
        parent_column = Village.district_id
        parent_key = "district_id"

    geometry = model.geom
    if simplify_m > 0:
        geometry = func.ST_Transform(
            func.ST_SimplifyPreserveTopology(
                func.ST_Transform(model.geom, 3857),
                simplify_m,
            ),
            4326,
        )

    statement = (
        select(
            model.id,
            model.code,
            model.name,
            parent_column,
            func.ST_AsGeoJSON(geometry, 6).label("geojson"),
        )
        .where(func.ST_Intersects(model.geom, envelope))
        .order_by(model.name, model.id)
        .limit(limit + 1)
    )

    rows = db.execute(statement).all()
    truncated = len(rows) > limit
    rows = rows[:limit]

    return {
        "type": "FeatureCollection",
        "level": level,
        "bbox": [minx, miny, maxx, maxy],
        "simplify_m": simplify_m,
        "truncated": truncated,
        "features": [
            {
                "type": "Feature",
                "id": row.id,
                "properties": {
                    "id": row.id,
                    "code": row.code,
                    "name": row.name,
                    parent_key: row[3],
                },
                "geometry": geometry_to_geojson(row.geojson),
            }
            for row in rows
        ],
    }
