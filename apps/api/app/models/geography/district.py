from sqlalchemy import Integer, BigInteger, String
from sqlalchemy.orm import Mapped, mapped_column
from geoalchemy2 import Geometry

from app.models.base import Base


class District(Base):
    __tablename__ = "districts"
    __table_args__ = {"schema": "core"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    fid: Mapped[int | None] = mapped_column(BigInteger)
    code: Mapped[str | None] = mapped_column(String)
    name: Mapped[str | None] = mapped_column(String)
    regency_code: Mapped[str | None] = mapped_column(String)

    geom = mapped_column(Geometry("GEOMETRY", srid=4326))