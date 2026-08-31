from fastapi import APIRouter

from card_reader.routes import extract, health

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(extract.router, tags=["extract"])

__all__ = ["api_router"]
