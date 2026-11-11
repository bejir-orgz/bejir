from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.assistant import AssistantChatRequest, AssistantChatResponse
from app.services.assistant import AssistantService

router = APIRouter()


@router.post("/chat", response_model=AssistantChatResponse)
def chat(request: AssistantChatRequest, db: Session = Depends(get_db)):
    try:
        return AssistantService.chat(db, request)
    except RuntimeError as exc:
        errors = {
            "AI_NOT_CONFIGURED": (
                "Asisten AI belum dikonfigurasi. Atur GEMINI_API_KEY pada backend."
            ),
            "DATA_UNAVAILABLE": "Data Bejir sementara tidak dapat diakses.",
            "AI_PROVIDER_UNAVAILABLE": (
                "Layanan AI sementara tidak tersedia atau kuotanya tercapai."
            ),
        }
        detail = str(exc)
        if detail not in errors:
            raise HTTPException(
                status_code=503,
                detail="Layanan asisten AI sementara tidak tersedia.",
            ) from exc
        raise HTTPException(status_code=503, detail=errors[detail]) from exc
