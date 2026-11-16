import re

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.evacuation import EvacuationSite
from app.models.flood import FloodEvent
from app.models.geography.district import District
from app.models.geography.regency import Regency
from app.repositories.geography.river import RiverRepository
from app.models.spatial_analysis import (
    DistrictHazardStatistics,
    PopulationExposure,
)


def _mentioned_locations(db: Session, question: str) -> tuple[list[str], list[str]]:
    district_names: set[str] = set()
    regency_names: set[str] = set()
    normalized_question = question.casefold()
    locations = db.execute(
        select(District.name, Regency.name)
        .join(Regency, Regency.id == District.regency_id)
        .distinct()
    ).all()

    for district_name, regency_name in locations:
        if (
            district_name
            and len(district_name) >= 4
            and re.search(
                rf"(?<!\w){re.escape(district_name.casefold())}(?!\w)",
                normalized_question,
            )
        ):
            district_names.add(district_name)
        if (
            regency_name
            and len(regency_name) >= 4
            and re.search(
                rf"(?<!\w){re.escape(regency_name.casefold())}(?!\w)",
                normalized_question,
            )
        ):
            regency_names.add(regency_name)

    return sorted(district_names), sorted(regency_names)


def _location_filter(district_names: list[str], regency_names: list[str]):
    matches = []
    if district_names:
        matches.append(District.name.in_(district_names))
    if regency_names:
        matches.append(Regency.name.in_(regency_names))
    return or_(*matches) if matches else None


class AssistantRepository:
    """Builds a small, bounded context from Bejir's existing database records."""

    @staticmethod
    def get_context(
        db: Session,
        *,
        question: str,
        sources: list[str],
    ) -> dict:
        context: dict[str, object] = {}
        district_names, regency_names = _mentioned_locations(db, question)
        location_filter = _location_filter(district_names, regency_names)

        if "rivers" in sources:
            context["rivers"] = {
                **RiverRepository.get_assistant_summary(db, location_filter=location_filter),
                "scope": {
                    "districts": district_names,
                    "regencies": regency_names,
                    "coverage": "mentioned_regions" if location_filter is not None else "entire_dataset",
                },
                "note": (
                    "Inventaris jaringan sungai Jawa Barat, bukan kondisi real-time. "
                    "Jumlah adalah segmen rekaman, bukan jumlah sungai bernama unik. "
                    "Segmen yang berpotongan dengan beberapa kecamatan dihitung sekali. "
                    "Kelompok nama/jenis hanya cuplikan terbesar; nama kosong berarti tidak tersedia. "
                    "Jika tidak ada daerah dikenali, cakupan adalah seluruh dataset, bukan daerah yang ditanyakan. "
                    "Data tidak memuat debit, tinggi muka air, atau status luapan."
                ),
            }

        if "flood_history" in sources:
            event_count = db.scalar(select(func.count(FloodEvent.id))) or 0
            event_query = (
                select(
                    FloodEvent.event_datetime,
                    FloodEvent.event_id,
                    Regency.name.label("regency_name"),
                )
                .outerjoin(Regency, Regency.id == FloodEvent.regency_id)
            )
            matching_event_count = None
            if regency_names:
                regency_filter = Regency.name.in_(regency_names)
                matching_event_count = db.scalar(
                    select(func.count(FloodEvent.id))
                    .outerjoin(Regency, Regency.id == FloodEvent.regency_id)
                    .where(regency_filter)
                ) or 0
                event_query = event_query.where(regency_filter)
            elif district_names:
                # Historical flood records are associated with regencies, not districts.
                event_query = event_query.where(False)
            latest_events = db.execute(
                event_query
                .order_by(FloodEvent.event_datetime.desc().nullslast())
                .limit(8)
            ).mappings().all()
            context["flood_history"] = {
                "west_java_record_count": event_count,
                "matching_regency_record_count": matching_event_count,
                "recent_records": [
                    {
                        "date": row["event_datetime"].isoformat()
                        if row["event_datetime"]
                        else None,
                        "event_id": row["event_id"],
                        "regency": row["regency_name"],
                    }
                    for row in latest_events
                ],
                "note": (
                    "Catatan historis tingkat kabupaten/kota; bukan kejadian langsung. "
                    "Sumber ini tidak menyimpan rincian kejadian per kecamatan."
                ),
            }

        if "flood_susceptibility" in sources:
            query = (
                select(DistrictHazardStatistics, District.name.label("district_name"))
                .join(District, District.id == DistrictHazardStatistics.district_id)
                .outerjoin(Regency, Regency.id == District.regency_id)
            )
            top_rows = db.execute(
                query.order_by(
                    DistrictHazardStatistics.mean_kerawanan_v2.desc().nullslast()
                ).limit(8)
            ).all()

            matching_rows = []
            if location_filter is not None:
                matching_rows = db.execute(
                    query.where(location_filter)
                    .order_by(District.name.asc())
                    .limit(8)
                ).all()

            distinct_rows = {row[0].district_id: row for row in top_rows}
            distinct_rows.update({row[0].district_id: row for row in matching_rows})
            context["flood_susceptibility"] = []
            for row in distinct_rows.values():
                statistics = row[0]
                context["flood_susceptibility"].append(
                    {
                        "district": row.district_name,
                        "mean_hazard_v2": statistics.mean_kerawanan_v2,
                        "pct_high_hazard_v2": statistics.pct_rawan_v2,
                        "mean_rainfall_mm": statistics.mean_hujan_mm,
                        "mean_elevation_m": statistics.mean_elevasi_m,
                        "mean_hand_m": statistics.mean_hand_m,
                        "mean_slope_pct": statistics.mean_slope_pct,
                        "dominant_landcover": statistics.landcover_dominan,
                    }
                )

        if "population_exposure" in sources:
            query = (
                select(PopulationExposure, District.name.label("district_name"))
                .join(District, District.id == PopulationExposure.district_id)
                .outerjoin(Regency, Regency.id == District.regency_id)
            )
            all_rows = db.execute(query).all()

            def population_value(row) -> float:
                value = row[0].pend_rawan_v2
                try:
                    return float(str(value).replace(",", ""))
                except (TypeError, ValueError):
                    return float("-inf")

            top_rows = sorted(all_rows, key=population_value, reverse=True)[:8]

            matching_rows = []
            if location_filter is not None:
                matching_rows = db.execute(
                    query.where(location_filter)
                    .order_by(District.name.asc())
                    .limit(8)
                ).all()

            distinct_rows = {row[0].district_id: row for row in top_rows}
            distinct_rows.update({row[0].district_id: row for row in matching_rows})
            context["population_exposure"] = []
            for row in distinct_rows.values():
                exposure = row[0]
                context["population_exposure"].append(
                    {
                        "district": row.district_name,
                        "estimated_population": exposure.penduduk_est,
                        "population_at_risk": exposure.pend_rawan_v2,
                        "population_at_risk_pct": exposure.pct_rawan_v2,
                        "exposed_to_1m_inundation": exposure.pend_genangan_1m,
                        "exposed_to_2m_inundation": exposure.pend_genangan_2m,
                        "exposed_to_3m_inundation": exposure.pend_genangan_3m,
                    }
                )

        if "evacuation_sites" in sources:
            statement = (
                select(
                    EvacuationSite.display_name,
                    EvacuationSite.name,
                    EvacuationSite.category,
                    District.name.label("district_name"),
                )
                .outerjoin(District, District.id == EvacuationSite.district_id)
                .outerjoin(Regency, Regency.id == District.regency_id)
            )
            if location_filter is not None:
                statement = statement.where(location_filter)
            sites = db.execute(
                statement.order_by(EvacuationSite.display_name.asc().nullslast())
                .limit(12)
            ).mappings().all()
            context["evacuation_sites"] = {
                "matching_records": [
                    {
                        "name": row["display_name"] or row["name"],
                        "category": row["category"],
                        "district": row["district_name"],
                    }
                    for row in sites
                ],
                "note": (
                    "Daftar ini tidak menjamin lokasi terhubung ke jaringan jalan. "
                    "Gunakan API rute evakuasi untuk memeriksa rute yang dapat dilalui."
                ),
            }

        return context
