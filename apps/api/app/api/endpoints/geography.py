
import json

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
