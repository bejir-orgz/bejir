from geoalchemy2 import Geometry
from sqlalchemy import BigInteger, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class District(Base):
    __tablename__ = "districts"
    __table_args__ = {"schema": "core"}

    id: Mapped[int] = mapped_column(primary_key=True)
    fid: Mapped[int | None] = mapped_column(BigInteger)
    code: Mapped[str | None] = mapped_column(String)
    name: Mapped[str | None] = mapped_column(String)

    geom = mapped_column(Geometry("GEOMETRY", srid=4326))


    regency_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("core.regency.id"),
        nullable=False,
    )

    regency = relationship(
        "Regency",
        back_populates="districts",
    )

    villages = relationship(
        "Village",
        back_populates="district",
    )