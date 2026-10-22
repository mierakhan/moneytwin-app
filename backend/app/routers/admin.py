from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session as OrmSession

from ..db import get_db
from ..deps import require_admin, require_csrf
from ..models import AIUsage, Budget, Conversation, SavingsGoal, Simulation, Transaction, User
from ..schemas import AdminUserPatch

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/metrics")
def metrics(_: User = Depends(require_admin), db: OrmSession = Depends(get_db)):
    """Aggregate platform health only: no user amounts, descriptions or chat text."""
    since = datetime.now(timezone.utc) - timedelta(days=7)
    users_total = db.scalar(select(func.count(User.id))) or 0
    users_active = db.scalar(select(func.count(User.id)).where(User.status == "active")) or 0
    txn_total = db.scalar(select(func.count(Transaction.id))) or 0
    ai_calls = db.scalar(select(func.count(AIUsage.id)).where(AIUsage.created_at >= since)) or 0
    ai_errors = db.scalar(select(func.count(AIUsage.id)).where(
        AIUsage.created_at >= since, AIUsage.status == "error")) or 0
    avg_latency = db.scalar(select(func.avg(AIUsage.latency_ms)).where(AIUsage.created_at >= since)) or 0
    return {
        "users": {"total": users_total, "active": users_active,
                  "demo": db.scalar(select(func.count(User.id)).where(User.is_demo.is_(True))) or 0},
        "content_counts": {
            "transactions": txn_total,
            "budgets": db.scalar(select(func.count(Budget.id))) or 0,
            "goals": db.scalar(select(func.count(SavingsGoal.id))) or 0,
            "simulations": db.scalar(select(func.count(Simulation.id))) or 0,
            "conversations": db.scalar(select(func.count(Conversation.id))) or 0,
        },
        "ai_last_7_days": {
            "calls": ai_calls,
            "errors": ai_errors,
            "error_rate": round(ai_errors / ai_calls, 3) if ai_calls else None,
            "avg_latency_ms": int(avg_latency),
        },
        "privacy_note": "Aggregates only. Transaction amounts, descriptions and chat messages are never exposed here.",
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/users")
def users(_: User = Depends(require_admin), db: OrmSession = Depends(get_db)):
    rows = db.scalars(select(User).order_by(User.created_at.desc()).limit(200))
    counts = dict(db.execute(select(Transaction.user_id, func.count(Transaction.id))
                             .group_by(Transaction.user_id)).all())
    return {"users": [
        {"id": u.id, "email": u.email, "display_name": u.display_name, "role": u.role,
         "status": u.status, "locale": u.locale, "is_demo": u.is_demo,
         "created_at": u.created_at.isoformat(),
         "transaction_count": int(counts.get(u.id, 0))}
        for u in rows
    ]}


@router.patch("/users/{user_id}")
def set_status(user_id: str, payload: AdminUserPatch, admin: User = Depends(require_csrf),
               db: OrmSession = Depends(get_db)):
    if admin.role != "admin":
        raise HTTPException(403, detail="Administrator access only")
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(404, detail="User not found")
    if target.id == admin.id:
        raise HTTPException(400, detail="You cannot change your own status")
    target.status = payload.status
    db.commit()
    return {"ok": True, "user_id": target.id, "status": target.status}
