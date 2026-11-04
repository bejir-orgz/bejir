from sqlalchemy import (
    Integer,
    String,
    Float,
    ForeignKey,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry

from app.models.base import Base


class DistrictHazardStatistics(Base):
    __tablename__ = "district_hazard_statistics"
    __table_args__ = {"schema": "core"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    district_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("core.districts.id"),
        nullable=False,
    )

    n_desa: Mapped[int | None] = mapped_column(Integer)
    n_piksel: Mapped[int | None] = mapped_column(Integer)

    luas_km2: Mapped[float | None] = mapped_column(Float)
    luaswh_km2: Mapped[float | None] = mapped_column(Float)
    pct_cakupan: Mapped[float | None] = mapped_column(Float)

    mean_kerawanan_v1: Mapped[float | None] = mapped_column(Float)
    mean_kerawanan_v2: Mapped[float | None] = mapped_column(Float)
    mean_elevasi_m: Mapped[float | None] = mapped_column(Float)
    mean_hand_m: Mapped[float | None] = mapped_column(Float)
    mean_hujan_mm: Mapped[float | None] = mapped_column(Float)
    mean_slope_pct: Mapped[float | None] = mapped_column(Float)

    pct_rawan_v1: Mapped[float | None] = mapped_column(Float)
    pct_rawan_v2: Mapped[float | None] = mapped_column(Float)

    kelas_dominan_v2: Mapped[int | None] = mapped_column(Integer)
    landcover_dominan: Mapped[str | None] = mapped_column(String)

    geom = mapped_column(Geometry("MULTIPOLYGON", srid=4326))

    district = relationship("District")