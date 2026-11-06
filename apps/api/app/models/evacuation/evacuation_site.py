from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.geography.district import District


class EvacuationSite(Base):
    __tablename__ = "evacuation_sites"
    __table_args__ = {"schema": "core"}

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    geom: Mapped[object | None] = mapped_column(
        Geometry("POINT", srid=4326),
        nullable=True,
    )

    fid: Mapped[int | None] = mapped_column(
        BigInteger,
        nullable=True,
    )

    osm_id: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    name: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    osm_type: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    category: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    source: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    code_kec: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    display_name: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    district_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("core.districts.id"),
    )

    district: Mapped["District | None"] = relationship(
        "District",
        back_populates="evacuation_sites",
    )
