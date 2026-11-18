from sqlalchemy import func, select
from sqlalchemy.orm import Session, aliased

from app.models.geography.district import District
from app.models.geography.regency import Regency
from app.models.spatial_analysis import DistrictRainfallMonthly


class RegencyRainfallMonthlyRepository:

    @staticmethod
    def get_all(
        db: Session,
        *,
        regency_id: int | None = None,
        year: int | None = None,
        month: int | None = None,
    ):
        district_count = aliased(District)
        n_kec_subquery = (
            select(func.count(district_count.id))
            .where(district_count.regency_id == Regency.id)
            .correlate(Regency)
            .scalar_subquery()
        )

        weight = DistrictRainfallMonthly.hujan_mm * DistrictRainfallMonthly.n_piksel
        total_weight = func.sum(DistrictRainfallMonthly.n_piksel)

        statement = (
            select(
                Regency.id.label("regency_id"),
                Regency.code.label("regency_code"),
                Regency.name.label("regency_name"),
                DistrictRainfallMonthly.year.label("year"),
                DistrictRainfallMonthly.month.label("month"),
                n_kec_subquery.label("n_kec"),
                func.count(
                    func.distinct(DistrictRainfallMonthly.district_id)
                ).label("n_kec_berdata"),
                (func.sum(weight) / func.nullif(total_weight, 0)).label(
                    "hujan_mm"
                ),
                func.min(DistrictRainfallMonthly.hujan_mm).label("min_mm"),
                func.max(DistrictRainfallMonthly.hujan_mm).label("maks_mm"),
            )
            .join(
                District,
                District.id == DistrictRainfallMonthly.district_id,
            )
            .join(Regency, Regency.id == District.regency_id)
            # Districts without CHIRPS coverage are excluded from the
            # weighting, not counted as zero.
            .where(DistrictRainfallMonthly.hujan_mm.is_not(None))
            .group_by(
                Regency.id,
                Regency.code,
                Regency.name,
                DistrictRainfallMonthly.year,
                DistrictRainfallMonthly.month,
            )
            .order_by(
                Regency.id.asc(),
                func.coalesce(DistrictRainfallMonthly.year, 0).asc(),
                DistrictRainfallMonthly.month.asc(),
            )
        )

        if regency_id is not None:
            statement = statement.where(Regency.id == regency_id)

        # A year filter intentionally excludes climatology rows (year IS NULL).
        if year is not None:
            statement = statement.where(
                DistrictRainfallMonthly.year == year
            )

        if month is not None:
            statement = statement.where(DistrictRainfallMonthly.month == month)

        return list(db.execute(statement).all())
