from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Float, ForeignKey, Integer, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.evacuation.road_segment import RoadSegment
    from app.models.evacuation.route_destination import RouteDestination


class RouteSegment(Base):
    __tablename__ = "route_segments"
    __table_args__ = (
        UniqueConstraint(
            "route_destination_id",
            "sequence",
            name="uq_route_segment_sequence",
        ),
        {"schema": "core"},
    )

    id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    route_destination_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("core.route_destinations.id", ondelete="CASCADE"),
        nullable=False,
    )
    road_segment_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("core.road_segments.id"),
        nullable=False,
    )
    sequence: Mapped[int] = mapped_column(Integer, nullable=False)
    distance_m: Mapped[float] = mapped_column(Float, nullable=False)

    route_destination: Mapped["RouteDestination"] = relationship(
        "RouteDestination",
        back_populates="segments",
    )
    road_segment: Mapped["RoadSegment"] = relationship()
