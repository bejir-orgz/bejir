from sqlalchemy import Float, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class DistrictRainfallMonthly(Base):
    __tablename__ = "district_rainfall_monthly"
    __table_args__ = {"schema": "core"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    district_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("core.districts.id"),
        nullable=False,
    )

    # NULL means a climatology aggregate (e.g. the 2015-2024 mean) instead of
    # one specific year. Per-year records fill this column.
    year: Mapped[int | None] = mapped_column(Integer, nullable=True)

    month: Mapped[int] = mapped_column(Integer, nullable=False)

    # Pixels counted under the rainfall mask; not the hazard-layer n_piksel.
    n_piksel: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # NULL marks a district without CHIRPS coverage (e.g. 7 districts in
    # Bekasi). It must never be coerced to 0 by the API.
    hujan_mm: Mapped[float | None] = mapped_column(Float, nullable=True)

    district = relationship("District")
