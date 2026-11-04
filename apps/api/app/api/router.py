from fastapi import APIRouter

from app.api.endpoints import geography

api_router = APIRouter()

# api_router.include_router(health.router, tags=["Health"])
api_router.include_router(
    geography.router,
    prefix="/geography",
    tags=["Geography"],
)