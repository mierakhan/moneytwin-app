from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session as OrmSession

from ..db import get_db
from ..deps import get_current_user
from ..models import User
from ..schemas import parse_month
from ..services import finance

router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get("/dashboard")
def get_dashboard(month: str | None = Query(default=None), user: User = Depends(get_current_user),
                  db: OrmSession = Depends(get_db)):
    try:
        start = parse_month(month) or finance.month_start()
    except ValueError:
        raise HTTPException(400, detail="month must look like YYYY-MM")
    return finance.dashboard(db, user, start)


@router.get("/history")
def get_history(months: int = Query(default=6, ge=1, le=24),
                user: User = Depends(get_current_user), db: OrmSession = Depends(get_db)):
    """Monthly summaries ending with the current month. Missing months are reported, not filled."""
    return finance.month_history(db, user, months)
