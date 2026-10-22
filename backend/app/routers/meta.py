from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session as OrmSession

from ..db import get_db
from ..services import ai

router = APIRouter(tags=["meta"])


@router.get("/health")
def health():
    return {"status": "ok", "service": "moneytwin-api"}


@router.get("/ready")
def ready(db: OrmSession = Depends(get_db)):
    db.execute(text("SELECT 1"))
    cfg = ai.provider_config()
    return {"status": "ready", "database": "ok", "ai_provider": cfg["provider"],
            "ai_configured": cfg["configured"]}
