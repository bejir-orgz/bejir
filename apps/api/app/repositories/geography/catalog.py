from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.geography.district import District
from app.models.geography.regency import Regency


class GeographyRepository:
    @staticmethod
    def get_catalog(db: Session, province_code: str) -> dict:
        regencies = db.execute(
            select(Regency.id, Regency.name)
            .where(Regency.province_code == province_code)
            .order_by(Regency.name, Regency.id)
        ).mappings().all()
        districts = db.execute(
            select(District.id, District.name, District.regency_id)
            .join(Regency, District.regency_id == Regency.id)
            .where(Regency.province_code == province_code)
            .order_by(District.name, District.id)
        ).mappings().all()
        return {"regencies": regencies, "districts": districts}
