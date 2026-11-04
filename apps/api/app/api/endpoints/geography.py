from app.db.session import get_db

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.geography.province import Province
from app.models.geography.regency import Regency
from app.models.geography.district import District

router = APIRouter()


@router.get("/provinces")
def get_provinces(db: Session = Depends(get_db)):
    statement = select(Province).order_by(Province.name)

    provinces = db.scalars(statement).all()

    return [
        {
            "id": province.id,
            "code": province.code,
            "name": province.name,
        }
        for province in provinces
    ]


@router.get("/regencies")
def get_regencies(db: Session = Depends(get_db)):
    statement = select(Regency).order_by(Regency.name)

    regencies = db.scalars(statement).all()

    return [
        {
            "id": regency.id,
            "code": regency.code,
            "name": regency.name,
        }
        for regency in regencies
    ]


@router.get("/districts")
def get_districts(db: Session = Depends(get_db)):
    statement = select(District).order_by(District.name)

    districts = db.scalars(statement).all()

    return [
        {
            "id": district.id,
            "code": district.code,
            "name": district.name,
            "regency_code": district.regency_code,
        }
        for district in districts
    ]