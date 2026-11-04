from sqlalchemy.orm import Session

from app.repositories.flood import FloodEventTypeRepository
from app.schemas.flood import FloodEventTypeResponse


class FloodEventTypeService:

    @staticmethod
    def list_event_types(
        db: Session,
    ) -> list[FloodEventTypeResponse]:
        event_types = FloodEventTypeRepository.get_all(db)

        return [
            FloodEventTypeResponse.model_validate(event_type)
            for event_type in event_types
        ]

    @staticmethod
    def get_event_type(
        db: Session,
        event_type_id: int,
    ) -> FloodEventTypeResponse | None:
        event_type = FloodEventTypeRepository.get_by_id(
            db,
            event_type_id,
        )

        if event_type is None:
            return None

        return FloodEventTypeResponse.model_validate(event_type)

    @staticmethod
    def get_event_type_by_code(
        db: Session,
        code: int,
    ) -> FloodEventTypeResponse | None:
        event_type = FloodEventTypeRepository.get_by_code(db, code)

        if event_type is None:
            return None

        return FloodEventTypeResponse.model_validate(event_type)
