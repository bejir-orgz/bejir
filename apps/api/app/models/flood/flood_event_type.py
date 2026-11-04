from sqlalchemy import BigInteger, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class FloodEventType(Base):
    __tablename__ = "flood_event_types"
    __table_args__ = {"schema": "core"}

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
    )

    code: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        unique=True,
    )

    name: Mapped[str] = mapped_column(
        String,
        nullable=False,
        unique=True,
    )

    flood_events: Mapped[list["FloodEvent"]] = relationship(
        "FloodEvent",
        back_populates="event_type",
    )