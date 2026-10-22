from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session as OrmSession

from ..db import get_db
from ..deps import get_current_user, require_csrf
from ..models import Budget, Category, User
from ..schemas import BudgetIn, BudgetUpdate, parse_month, to_minor_nonneg
from ..services import finance

router = APIRouter(prefix="/api/budgets", tags=["budgets"])


@router.get("")
def list_budgets(month: str | None = Query(default=None), user: User = Depends(get_current_user),
                 db: OrmSession = Depends(get_db)):
    try:
        start = parse_month(month) or finance.month_start()
    except ValueError:
        raise HTTPException(400, detail="month must look like YYYY-MM")
    return {"month": f"{start.year:04d}-{start.month:02d}",
            "month_label": finance.month_label(start, user.locale),
            "budgets": finance.budget_rows(db, user.id, start)}


@router.get("/summary")
def summary(month: str | None = Query(default=None), user: User = Depends(get_current_user),
            db: OrmSession = Depends(get_db)):
    try:
        start = parse_month(month) or finance.month_start()
    except ValueError:
        raise HTTPException(400, detail="month must look like YYYY-MM")
    rows = finance.budget_rows(db, user.id, start)
    return {
        "month": f"{start.year:04d}-{start.month:02d}",
        "month_label": finance.month_label(start, user.locale),
        "total_limit": finance.money(sum(r["limit_minor"] for r in rows)),
        "total_spent": finance.money(sum(r["spent_minor"] for r in rows)),
        "alerts": [r for r in rows if r["state"] in ("warning", "reached", "over")],
        "budgets": rows,
    }


@router.post("", status_code=201)
def create_budget(payload: BudgetIn, user: User = Depends(require_csrf),
                  db: OrmSession = Depends(get_db)):
    start = parse_month(payload.month)
    cat = db.scalar(select(Category).where(Category.id == payload.category_id, Category.user_id == user.id))
    if not cat:
        raise HTTPException(400, detail="Unknown category for this account")
    if cat.type != "expense":
        raise HTTPException(400, detail="Budgets apply to expense categories only")
    limit_minor = to_minor_nonneg(payload.limit)
    existing = db.scalar(select(Budget).where(
        Budget.user_id == user.id, Budget.category_id == cat.id, Budget.month == start))
    if existing:
        # One budget per category per month: update instead of duplicating.
        existing.limit_minor = limit_minor
        db.commit()
        rows = finance.budget_rows(db, user.id, start)
        row = next((r for r in rows if r["id"] == existing.id), None)
        return {"updated": True, "budget": row}
    budget = Budget(user_id=user.id, category_id=cat.id, month=start, limit_minor=limit_minor)
    db.add(budget)
    db.commit()
    rows = finance.budget_rows(db, user.id, start)
    row = next((r for r in rows if r["id"] == budget.id), None)
    return {"updated": False, "budget": row}


@router.patch("/{budget_id}")
def update_budget(budget_id: str, payload: BudgetUpdate, user: User = Depends(require_csrf),
                  db: OrmSession = Depends(get_db)):
    budget = db.scalar(select(Budget).where(Budget.id == budget_id, Budget.user_id == user.id))
    if not budget:
        raise HTTPException(404, detail="Budget not found")
    budget.limit_minor = to_minor_nonneg(payload.limit)
    db.commit()
    rows = finance.budget_rows(db, user.id, budget.month)
    row = next((r for r in rows if r["id"] == budget.id), None)
    return {"budget": row}


@router.delete("/{budget_id}")
def delete_budget(budget_id: str, user: User = Depends(require_csrf), db: OrmSession = Depends(get_db)):
    budget = db.scalar(select(Budget).where(Budget.id == budget_id, Budget.user_id == user.id))
    if not budget:
        raise HTTPException(404, detail="Budget not found")
    db.delete(budget)
    db.commit()
    return {"ok": True, "deleted": budget_id}
