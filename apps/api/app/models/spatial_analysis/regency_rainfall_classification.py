from sqlalchemy import BigInteger, Float, ForeignKey, Integer, SmallInteger, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class RegencyRainfallClassification(Base):
    __tablename__ = "regency_rainfall_classification"
    __table_args__ = {"schema": "core"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    regency_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("core.regency.id"),
        nullable=False,
        unique=True,
    )

    n_kec: Mapped[int | None] = mapped_column(Integer, nullable=True)
    n_kec_berdata: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Annual mean rainfall and district extrema (climatology).
    mean_hujan_mm: Mapped[float | None] = mapped_column(Float, nullable=True)
    min_kec_mm: Mapped[float | None] = mapped_column(Float, nullable=True)
    maks_kec_mm: Mapped[float | None] = mapped_column(Float, nullable=True)

    kelas_hujan: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    label_hujan: Mapped[str | None] = mapped_column(String, nullable=True)

    regency = relationship("Regency")
