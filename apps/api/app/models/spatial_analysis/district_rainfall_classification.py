from sqlalchemy import Float, ForeignKey, Integer, SmallInteger, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class DistrictRainfallClassification(Base):
    __tablename__ = "district_rainfall_classification"
    __table_args__ = {"schema": "core"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    district_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("core.districts.id"),
        nullable=False,
        unique=True,
    )

    # Total pixels of the district, not the pixels under the rainfall mask.
    n_piksel: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Annual mean rainfall (climatology), not a monthly value.
    mean_hujan_mm: Mapped[float | None] = mapped_column(Float, nullable=True)

    # NULL marks a district without CHIRPS coverage (e.g. 7 districts in
    # Bekasi). It must never be coerced to a class by the API.
    kelas_hujan: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    label_hujan: Mapped[str | None] = mapped_column(String, nullable=True)

    district = relationship("District")
