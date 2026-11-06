from sqlalchemy import BigInteger, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from geoalchemy2 import Geometry

from app.models.base import Base


class RoadSegment(Base):
    __tablename__ = "road_segments"
    __table_args__ = {"schema": "core"}

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    geom: Mapped[object | None] = mapped_column(
        Geometry("LINESTRING", srid=4326),
        nullable=True,
    )

    fid: Mapped[int | None] = mapped_column(
        BigInteger,
        nullable=True,
    )

    road_class: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    name: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    oneway: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    speed_kmh: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    length_m: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    source_node: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    target_node: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    cost: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    reverse_cost: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
