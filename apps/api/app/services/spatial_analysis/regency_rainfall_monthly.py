from sqlalchemy.orm import Session

from app.repositories.spatial_analysis import RegencyRainfallMonthlyRepository
from app.schemas.spatial_analysis import RegencyRainfallMonthlyResponse


class RegencyRainfallMonthlyService:

    @staticmethod
    def list_rainfall_monthly(
        db: Session,
        *,
        regency_id: int | None = None,
        year: int | None = None,
        month: int | None = None,
    ) -> list[RegencyRainfallMonthlyResponse]:
        records = RegencyRainfallMonthlyRepository.get_all(
            db,
            regency_id=regency_id,
            year=year,
            month=month,
        )

        return [
            RegencyRainfallMonthlyResponse(
                regency_id=record.regency_id,
                regency_code=record.regency_code,
                regency_name=record.regency_name,
                year=record.year,
                month=record.month,
                period=(
                    f"{record.year}-{record.month:02d}"
                    if record.year is not None
                    else None
                ),
                n_kec=record.n_kec,
                n_kec_berdata=record.n_kec_berdata,
                hujan_mm=record.hujan_mm,
                min_mm=record.min_mm,
                maks_mm=record.maks_mm,
            )
            for record in records
        ]
