from sqlalchemy import Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class PopulationExposure(Base):
    __tablename__ = "population_exposures"
    __table_args__ = {"schema": "core"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    fid: Mapped[int | None] = mapped_column(Integer)

    district_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("core.districts.id"),
        nullable=False,
    )

    n_piksel: Mapped[str | None] = mapped_column(String)
    luas_km2: Mapped[str | None] = mapped_column(String)
    penduduk_est: Mapped[str | None] = mapped_column(String)
    kepadatan_jiwa_km2: Mapped[str | None] = mapped_column(String)

    pend_rawan_v2: Mapped[str | None] = mapped_column(String)
    pct_rawan_v2: Mapped[str | None] = mapped_column(String)

    pend_genangan_1m: Mapped[str | None] = mapped_column(String)
    pct_genangan_1m: Mapped[str | None] = mapped_column(String)

    pend_genangan_2m: Mapped[str | None] = mapped_column(String)
    pct_genangan_2m: Mapped[str | None] = mapped_column(String)

    pend_genangan_3m: Mapped[str | None] = mapped_column(String)
    pct_genangan_3m: Mapped[str | None] = mapped_column(String)

    district = relationship("District")