from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Float, ForeignKey, Integer, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.evacuation.evacuation_site import EvacuationSite
    from app.models.evacuation.route_request import RouteRequest
    from app.models.evacuation.route_segment import RouteSegment


class RouteDestination(Base):
    __tablename__ = "route_destinations"
    __table_args__ = (
        UniqueConstraint("route_request_id", "rank", name="uq_route_destination_rank"),
        UniqueConstraint(
            "route_request_id",
            "evacuation_site_id",
            name="uq_route_destination_site",
        ),
        {"schema": "core"},
    )

    id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    route_request_id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        ForeignKey("core.route_requests.id", ondelete="CASCADE"),
        nullable=False,
    )
    evacuation_site_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("core.evacuation_sites.id"),
        nullable=False,
    )
    distance_m: Mapped[float] = mapped_column(Float, nullable=False)
    duration_minutes: Mapped[float | None] = mapped_column(Float)
    rank: Mapped[int] = mapped_column(Integer, nullable=False)

    route_request: Mapped["RouteRequest"] = relationship(
        "RouteRequest",
        back_populates="destinations",
    )
    evacuation_site: Mapped["EvacuationSite"] = relationship()
    segments: Mapped[list["RouteSegment"]] = relationship(
        "RouteSegment",
        back_populates="route_destination",
        cascade="all, delete-orphan",
    )
