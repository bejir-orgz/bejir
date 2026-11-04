from sqlalchemy import BigInteger, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base

from sqlalchemy.orm import relationship


class FloodEventType(Base):
    __tablename__ = "flood_event_types"
    __table_args__ = {"schema": "core"}

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    code: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)

    events = relationship(
        "FloodEvent",
        back_populates="event_type",
    )