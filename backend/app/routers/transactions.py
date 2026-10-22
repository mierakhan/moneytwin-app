from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session as OrmSession

from ..db import get_db
from ..deps import get_current_user, require_csrf
from ..models import Category, Transaction, User
from ..schemas import TransactionIn, TransactionUpdate, money, to_minor
from ..services.finance import month_end, parse_month_str

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


def _payload(t: Transaction, c: Category) -> dict:
    return {
        "id": t.id,
        "type": t.type,
        "amount": money(t.amount_minor),
        "category_id": t.category_id,
        "category": c.name,
        "transaction_date": t.transaction_date.isoformat(),
        "description": t.description,
        "merchant": t.merchant,
        "is_refund": t.is_refund,
        "created_at": t.created_at.isoformat() if t.created_at else None,
    }


def _owned_category(db: OrmSession, user: User, category_id: str, type_: str) -> Category:
    cat = db.scalar(select(Category).where(Category.id == category_id, Category.user_id == user.id))
    if not cat:
        raise HTTPException(400, detail="Unknown category for this account")
    if cat.type != type_:
        raise HTTPException(400, detail=f"Category '{cat.name}' is an {cat.type} category")
    return cat


@router.get("")
def list_transactions(
    month: str | None = Query(default=None),
    type: str | None = Query(default=None),
    category_id: str | None = Query(default=None),
    q: str | None = Query(default=None, max_length=100),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    user: User = Depends(get_current_user),
    db: OrmSession = Depends(get_db),
):
    if type and type not in ("income", "expense"):
        raise HTTPException(400, detail="type must be income or expense")
    stmt = select(Transaction, Category).join(Category, Transaction.category_id == Category.id).where(
        Transaction.user_id == user.id
    )
    if month:
        try:
            start = parse_month_str(month)
        except ValueError:
            raise HTTPException(400, detail="month must look like YYYY-MM")
        stmt = stmt.where(Transaction.transaction_date >= start, Transaction.transaction_date <= month_end(start))
    if type:
        stmt = stmt.where(Transaction.type == type)
    if category_id:
        stmt = stmt.where(Transaction.category_id == category_id)
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(or_(Transaction.description.ilike(like), Transaction.merchant.ilike(like),
                              Category.name.ilike(like)))
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = db.execute(
        stmt.order_by(Transaction.transaction_date.desc(), Transaction.created_at.desc())
        .limit(limit).offset(offset)
    ).all()
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": [_payload(t, c) for t, c in rows],
    }


@router.post("", status_code=201)
def create_transaction(payload: TransactionIn, user: User = Depends(require_csrf),
                       db: OrmSession = Depends(get_db)):
    cat = _owned_category(db, user, payload.category_id, payload.type)
    if payload.is_refund and payload.type != "expense":
        raise HTTPException(400, detail="Refunds are recorded against expense categories")
    duplicate = db.scalar(select(Transaction.id).where(
        Transaction.user_id == user.id,
        Transaction.amount_minor == to_minor(payload.amount),
        Transaction.transaction_date == payload.transaction_date,
        Transaction.category_id == cat.id,
        Transaction.type == payload.type,
        Transaction.description == payload.description,
    ))
    if duplicate:
        raise HTTPException(409, detail="An identical transaction already exists for that date")
    t = Transaction(
        user_id=user.id,
        type=payload.type,
        amount_minor=to_minor(payload.amount),
        category_id=cat.id,
        transaction_date=payload.transaction_date,
        description=(payload.description or None),
        merchant=(payload.merchant or None),
        is_refund=payload.is_refund,
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return _payload(t, cat)


@router.get("/{transaction_id}")
def get_transaction(transaction_id: str, user: User = Depends(get_current_user),
                    db: OrmSession = Depends(get_db)):
    row = db.execute(
        select(Transaction, Category).join(Category, Transaction.category_id == Category.id)
        .where(Transaction.id == transaction_id, Transaction.user_id == user.id)
    ).first()
    if not row:
        raise HTTPException(404, detail="Transaction not found")
    return _payload(row[0], row[1])


@router.patch("/{transaction_id}")
def update_transaction(transaction_id: str, payload: TransactionUpdate,
                       user: User = Depends(require_csrf), db: OrmSession = Depends(get_db)):
    t = db.scalar(select(Transaction).where(Transaction.id == transaction_id, Transaction.user_id == user.id))
    if not t:
        raise HTTPException(404, detail="Transaction not found")
    new_type = payload.type or t.type
    if payload.category_id:
        _owned_category(db, user, payload.category_id, new_type)
        t.category_id = payload.category_id
    if payload.type:
        t.type = payload.type
    if payload.amount is not None:
        t.amount_minor = to_minor(payload.amount)
    if payload.transaction_date is not None:
        t.transaction_date = payload.transaction_date
    if payload.description is not None:
        t.description = payload.description or None
    if payload.merchant is not None:
        t.merchant = payload.merchant or None
    db.commit()
    db.refresh(t)
    cat = db.get(Category, t.category_id)
    return _payload(t, cat)


@router.delete("/{transaction_id}", status_code=200)
def delete_transaction(transaction_id: str, user: User = Depends(require_csrf),
                       db: OrmSession = Depends(get_db)):
    t = db.scalar(select(Transaction).where(Transaction.id == transaction_id, Transaction.user_id == user.id))
    if not t:
        raise HTTPException(404, detail="Transaction not found")
    db.delete(t)
    db.commit()
    return {"ok": True, "deleted": transaction_id}
