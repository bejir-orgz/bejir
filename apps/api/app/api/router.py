from fastapi import APIRouter

from app.api.endpoints import flood, geography, spatial_analysis

api_router = APIRouter()

# api_router.include_router(health.router, tags=["Health"])
api_router.include_router(
    geography.router,
    prefix="/geography",
    tags=["Geography"],
)
api_router.include_router(
    flood.router,
    prefix="/flood",
    tags=["Flood"],
)
api_router.include_router(
    spatial_analysis.router,
    prefix="/spatial-analysis",
    tags=["Spatial Analysis"],
)