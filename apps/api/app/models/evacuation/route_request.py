from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from geoalchemy2 import Geometry
from sqlalchemy import DateTime, String, Text, func, text
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.evacuation.route_destination import RouteDestination


class RouteRequest(Base):
    __tablename__ = "route_requests"
    __table_args__ = {"schema": "core"}

    id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    origin: Mapped[object] = mapped_column(
        Geometry("POINT", srid=4326),
        nullable=False,
    )
    requested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    travel_mode: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        server_default=text("'driving'"),
    )
    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        server_default=text("'pending'"),
    )
    error_message: Mapped[str | None] = mapped_column(Text)

    destinations: Mapped[list["RouteDestination"]] = relationship(
        "RouteDestination",
        back_populates="route_request",
        cascade="all, delete-orphan",
    )
