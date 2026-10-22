from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session as OrmSession

from ..db import get_db
from ..deps import get_current_user, require_csrf
from ..models import SavingsGoal, User
from ..schemas import ContributionIn, GoalIn, GoalUpdate, from_minor, money, to_minor, to_minor_nonneg
from ..services import finance

router = APIRouter(prefix="/api/goals", tags=["goals"])


def _get_owned(db: OrmSession, user: User, goal_id: str) -> SavingsGoal:
    goal = db.scalar(select(SavingsGoal).where(SavingsGoal.id == goal_id, SavingsGoal.user_id == user.id))
    if not goal:
        raise HTTPException(404, detail="Savings goal not found")
    return goal


@router.get("")
def list_goals(user: User = Depends(get_current_user), db: OrmSession = Depends(get_db)):
    goals = db.scalars(select(SavingsGoal).where(SavingsGoal.user_id == user.id)
                       .order_by(SavingsGoal.created_at.desc()))
    return {"goals": [finance.goal_progress(g) for g in goals]}


@router.post("", status_code=201)
def create_goal(payload: GoalIn, user: User = Depends(require_csrf), db: OrmSession = Depends(get_db)):
    # AC5.4: a new goal needs a future target date.
    if payload.deadline and payload.deadline < finance.kl_today():
        raise HTTPException(400, detail="Choose a target date in the future")
    target = to_minor(payload.target_amount)
    saved = to_minor_nonneg(payload.saved_amount)
    if saved > target:
        raise HTTPException(400, detail="Saved amount cannot exceed the target")
    goal = SavingsGoal(user_id=user.id, title=payload.title.strip(), target_minor=target,
                       saved_minor=saved, deadline=payload.deadline, status="active")
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return finance.goal_progress(goal)


@router.patch("/{goal_id}")
def update_goal(goal_id: str, payload: GoalUpdate, user: User = Depends(require_csrf),
                db: OrmSession = Depends(get_db)):
    goal = _get_owned(db, user, goal_id)
    if payload.title is not None:
        goal.title = payload.title.strip()
    if payload.target_amount is not None:
        goal.target_minor = to_minor(payload.target_amount)
    if payload.saved_amount is not None:
        goal.saved_minor = to_minor_nonneg(payload.saved_amount)
    if payload.deadline is not None:
        goal.deadline = payload.deadline
    if payload.status is not None:
        goal.status = payload.status
    if goal.saved_minor > goal.target_minor:
        raise HTTPException(400, detail="Saved amount cannot exceed the target")
    if goal.saved_minor >= goal.target_minor:
        goal.status = "completed"
    db.commit()
    db.refresh(goal)
    return finance.goal_progress(goal)


@router.post("/{goal_id}/contribute")
def contribute(goal_id: str, payload: ContributionIn, user: User = Depends(require_csrf),
               db: OrmSession = Depends(get_db)):
    """Bookkeeping only: no money moves, no payment provider is involved."""
    goal = _get_owned(db, user, goal_id)
    amount = to_minor(payload.amount)
    if goal.saved_minor + amount > goal.target_minor:
        raise HTTPException(400, detail=f"Contribution would exceed the target by "
                                        f"RM{from_minor(goal.saved_minor + amount - goal.target_minor)}")
    goal.saved_minor += amount
    if goal.saved_minor >= goal.target_minor:
        goal.status = "completed"
    db.commit()
    db.refresh(goal)
    return finance.goal_progress(goal)


@router.delete("/{goal_id}")
def delete_goal(goal_id: str, user: User = Depends(require_csrf), db: OrmSession = Depends(get_db)):
    goal = _get_owned(db, user, goal_id)
    db.delete(goal)
    db.commit()
    return {"ok": True, "deleted": goal_id}


@router.get("/{goal_id}/required-monthly")
def required_monthly(goal_id: str, months: int, user: User = Depends(get_current_user),
                     db: OrmSession = Depends(get_db)):
    goal = _get_owned(db, user, goal_id)
    result = finance.goal_required_monthly(goal.target_minor, goal.saved_minor, months)
    return {**result, "goal_id": goal.id, "title": goal.title,
            "remaining_amount": result.get("remaining_amount", money(0))}
