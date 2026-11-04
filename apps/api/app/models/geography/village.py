from geoalchemy2 import Geometry
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Village(Base):
    __tablename__ = "villages"
    __table_args__ = {"schema": "core"}

    id: Mapped[int] = mapped_column(primary_key=True)
    fid: Mapped[int | None]
    code: Mapped[str | None] = mapped_column(String)
    name: Mapped[str | None] = mapped_column(String)

    geom = mapped_column(Geometry("GEOMETRY", srid=4326))


    district_id: Mapped[int] = mapped_column(
        ForeignKey("core.districts.id"),
        nullable=False,
    )

    district = relationship(
        "District",
        back_populates="villages",
    )