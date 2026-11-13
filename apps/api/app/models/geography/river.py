from sqlalchemy import BigInteger, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from geoalchemy2 import Geometry

from app.models.base import Base


class River(Base):
    __tablename__ = "rivers"
    __table_args__ = {"schema": "core"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    geom = mapped_column(Geometry("MULTILINESTRINGZ", srid=3857))
    fid: Mapped[int | None] = mapped_column(BigInteger)
    source_id: Mapped[int | None] = mapped_column(BigInteger)
    name: Mapped[str | None] = mapped_column(String(50))
    river_type: Mapped[str | None] = mapped_column(String(250))
    layer_code: Mapped[str | None] = mapped_column(String(50))
    shape_length: Mapped[float | None] = mapped_column(Float)
