from sqlalchemy import BigInteger, String, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry

from app.models.base import Base


class Regency(Base):
    __tablename__ = "regency"
    __table_args__ = {"schema": "core"}

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    fid: Mapped[int | None] = mapped_column(BigInteger)
    code: Mapped[str | None] = mapped_column(String)
    province_code: Mapped[str | None] = mapped_column(String)
    area_source: Mapped[float | None] = mapped_column(Float)
    name: Mapped[str | None] = mapped_column(String)

    geom = mapped_column(Geometry("GEOMETRY", srid=4326))

    flood_events = relationship(
        "FloodEvent",
        back_populates="regency",
    )