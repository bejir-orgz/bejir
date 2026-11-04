from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class FloodEventImpact(Base):
    __tablename__ = "flood_event_impacts"
    __table_args__ = {"schema": "core"}

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    fatalities: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    missing: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    injured: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    affected_displaced: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    houses_heavily_damaged: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    houses_moderately_damaged: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    houses_slightly_damaged: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    houses_flooded: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    schools_damaged: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    religious_facilities_damaged: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    health_facilities_damaged: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    offices_damaged: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    bridges_damaged: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    flood_event_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("core.flood_events.id"),
        nullable=False,
    )

    # Relationship
    flood_event: Mapped["FloodEvent"] = relationship(
        "FloodEvent",
        back_populates="impacts",
    )