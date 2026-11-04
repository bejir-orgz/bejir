from sqlalchemy import Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class FloodEventImpact(Base):
    __tablename__ = "flood_event_impacts"
    __table_args__ = {"schema": "core"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    fatalities: Mapped[int | None] = mapped_column(Integer)
    missing: Mapped[int | None] = mapped_column(Integer)
    injured: Mapped[int | None] = mapped_column(Integer)
    affected_displaced: Mapped[int | None] = mapped_column(Integer)

    houses_heavily_damaged: Mapped[int | None] = mapped_column(Integer)
    houses_moderately_damaged: Mapped[int | None] = mapped_column(Integer)
    houses_slightly_damaged: Mapped[int | None] = mapped_column(Integer)
    houses_flooded: Mapped[int | None] = mapped_column(Integer)

    schools_damaged: Mapped[int | None] = mapped_column(Integer)
    religious_facilities_damaged: Mapped[int | None] = mapped_column(Integer)
    health_facilities_damaged: Mapped[int | None] = mapped_column(Integer)
    offices_damaged: Mapped[int | None] = mapped_column(Integer)
    bridges_damaged: Mapped[int | None] = mapped_column(Integer)

    flood_event_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("core.flood_events.id"),
        nullable=False,
    )

    flood_event = relationship(
        "FloodEvent",
        back_populates="impact",
    )