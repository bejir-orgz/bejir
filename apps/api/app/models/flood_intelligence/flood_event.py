from datetime import datetime

from sqlalchemy import (
    Integer,
    BigInteger,
    String,
    Boolean,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class FloodEvent(Base):
    __tablename__ = "flood_events"
    __table_args__ = {"schema": "core"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    event_id: Mapped[str | None] = mapped_column(String)
    event_datetime: Mapped[datetime | None] = mapped_column(DateTime)

    event_type_code: Mapped[int | None] = mapped_column(Integer)
    event_count: Mapped[bool | None] = mapped_column(Boolean)

    regency_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("core.regency.id"),
        nullable=False,
    )

    event_type_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("core.flood_event_types.id"),
        nullable=False,
    )

    regency = relationship(
        "Regency",
        back_populates="flood_events",
    )

    event_type = relationship(
        "FloodEventType",
        back_populates="events",
    )

    impact = relationship(
        "FloodEventImpact",
        back_populates="flood_event",
        uselist=False,
    )