from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    ForeignKey,
    Integer,
    String,
    DateTime,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class FloodEvent(Base):
    __tablename__ = "flood_events"
    __table_args__ = {"schema": "core"}

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    event_id: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    event_datetime: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    regency_code: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )

    event_type_code: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    event_count: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True,
    )

    event_type_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("core.flood_event_types.id"),
        nullable=False,
    )

    regency_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("core.regency.id"),
        nullable=True,
    )

    # Relationships
    event_type: Mapped["FloodEventType"] = relationship(
        "FloodEventType",
        back_populates="flood_events",
    )

    regency: Mapped["Regency | None"] = relationship(
        "Regency",
        back_populates="flood_events",
    )

    impacts: Mapped[list["FloodEventImpact"]] = relationship(
        "FloodEventImpact",
        back_populates="flood_event",
    )