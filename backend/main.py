"""Club Atlético Sucre API.

Phase 1 only exposes the health check; models, auth and routers arrive in Phase 2.
"""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import config

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

app = FastAPI(
    title="Club Atlético Sucre",
    version="0.1.0",
    description="API de la plataforma del Club Atlético Sucre (Ipiales, Nariño).",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.FRONTEND_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.get("/health", tags=["sistema"], summary="Estado del servidor (lo usa Render)")
def health() -> dict:
    return {"status": "ok"}
