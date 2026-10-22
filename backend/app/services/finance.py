"""Deterministic finance maths. No LLM ever computes these numbers."""
from __future__ import annotations

from calendar import monthrange
from datetime import date, datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Iterable
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Budget, Category, SavingsGoal, Transaction, User
from ..schemas import from_minor

KL = ZoneInfo("Asia/Kuala_Lumpur")

MONTH_NAMES_EN = ["January", "February", "March", "April", "May", "June", "July",
                  "August", "September", "October", "November", "December"]


def kl_now() -> datetime:
    return datetime.now(KL)


def kl_today() -> date:
    return kl_now().date()


def month_start(value: date | None = None) -> date:
    d = value or kl_today()
    return date(d.year, d.month, 1)


def parse_month_str(month: str | None) -> date:
    if not month:
        return month_start()
    year, mon = month.split("-")
    return date(int(year), int(mon), 1)


def month_end(month: date) -> date:
    last = monthrange(month.year, month.month)[1]
    return date(month.year, month.month, last)


def next_month(month: date) -> date:
    return date(month.year + (month.month == 12), month.month % 12 + 1, 1)


def months_between(start: date, end: date) -> int:
    """Whole calendar months from start (inclusive) to end (exclusive)."""
    return (end.year - start.year) * 12 + (end.month - start.month)


def month_label(month: date, locale: str = "en") -> str:
    if locale == "bm":
        names = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai",
                 "Ogos", "September", "Oktober", "November", "Disember"]
    else:
        names = MONTH_NAMES_EN
    return f"{names[month.month - 1]} {month.year}"


def money(minor: int) -> str:
    return from_minor(int(minor or 0))


def pct(numerator: int, denominator: int) -> float | None:
    if not denominator:
        return None
    return round((numerator / denominator) * 100, 2)


def _txn_sum(db: Session, user_id: str, start: date, end: date, type_: str) -> int:
    total = db.scalar(
        select(func.coalesce(func.sum(Transaction.amount_minor), 0)).where(
            Transaction.user_id == user_id,
            Transaction.type == type_,
            Transaction.transaction_date >= start,
            Transaction.transaction_date <= end,
        )
    )
    return int(total or 0)


def _spend_by_category(db: Session, user_id: str, start: date, end: date) -> dict[str, int]:
    """Net expense per category, refunds subtracted. Only this user's rows."""
    rows = db.execute(
        select(Transaction.category_id, Transaction.amount_minor, Transaction.is_refund)
        .where(
            Transaction.user_id == user_id,
            Transaction.type == "expense",
            Transaction.transaction_date >= start,
            Transaction.transaction_date <= end,
        )
    ).all()
    out: dict[str, int] = {}
    for category_id, amount, is_refund in rows:
        delta = -int(amount) if is_refund else int(amount)
        out[category_id] = out.get(category_id, 0) + delta
    return out


def _net_expenses(db: Session, user_id: str, start: date, end: date) -> int:
    """Expenses net of refunds. Refunds are expense rows flagged is_refund."""
    return sum(_spend_by_category(db, user_id, start, end).values())


def month_summary(db: Session, user_id: str, month: date) -> dict[str, Any]:
    start, end = month, month_end(month)
    income = _txn_sum(db, user_id, start, end, "income")
    by_cat = _spend_by_category(db, user_id, start, end)
    expenses = sum(by_cat.values())
    cats = {c.id: c for c in db.scalars(select(Category).where(Category.id.in_(by_cat.keys())))} if by_cat else {}
    breakdown = sorted(
        (
            {"category_id": cid, "name": cats[cid].name if cid in cats else "Uncategorised",
             "amount": money(amount), "amount_minor": amount}
            for cid, amount in by_cat.items()
        ),
        key=lambda r: r["amount_minor"],
        reverse=True,
    )
    return {
        "month": f"{month.year:04d}-{month.month:02d}",
        "month_label": month_label(month),
        "income": money(income),
        "expenses": money(expenses),
        "balance": money(income - expenses),
        "income_minor": income,
        "expenses_minor": expenses,
        "balance_minor": income - expenses,
        "categories": breakdown,
        "transaction_count": db.scalar(
            select(func.count(Transaction.id)).where(
                Transaction.user_id == user_id,
                Transaction.transaction_date >= start,
                Transaction.transaction_date <= end,
            )
        ) or 0,
    }


def budget_rows(db: Session, user_id: str, month: date) -> list[dict[str, Any]]:
    start, end = month, month_end(month)
    spend = _spend_by_category(db, user_id, start, end)
    budgets = db.execute(
        select(Budget, Category)
        .join(Category, Budget.category_id == Category.id)
        .where(Budget.user_id == user_id, Budget.month == start)
        .order_by(Category.name)
    ).all()
    rows = []
    for budget, category in budgets:
        spent = spend.get(category.id, 0)
        limit = int(budget.limit_minor)
        remaining = limit - spent
        percent = pct(spent, limit)
        if limit == 0:
            state = "over" if spent > 0 else "ok"
        elif spent > limit:
            state = "over"
        elif limit and spent == limit:
            state = "reached"
        elif percent is not None and percent >= 80:
            state = "warning"
        else:
            state = "ok"
        rows.append({
            "id": budget.id,
            "category_id": category.id,
            "category_name": category.name,
            "month": f"{month.year:04d}-{month.month:02d}",
            "limit": money(limit),
            "spent": money(spent),
            "remaining": money(remaining),
            "overspend": money(max(0, spent - limit)),
            "percent_used": percent,
            "state": state,
            # Refunded rows are netted; keep the raw terms for transparency.
            "limit_minor": limit,
            "spent_minor": spent,
            "remaining_minor": remaining,
        })
    return rows


def goal_progress(goal: SavingsGoal, today: date | None = None) -> dict[str, Any]:
    today = today or kl_today()
    target = int(goal.target_minor)
    saved = int(goal.saved_minor)
    remaining = max(0, target - saved)
    percent = round(min(100.0, (saved / target) * 100), 2) if target else 0.0
    months_left: int | None = None
    monthly_needed: str | None = None
    deadline_note: str | None = None
    if goal.deadline:
        delta_days = (goal.deadline - today).days
        if delta_days < 0:
            months_left = 0
            deadline_note = "overdue"
        else:
            # Whole months until the deadline; a partial month only counts if the day-of-month still fits.
            months_left = months_between(today, goal.deadline)
            if goal.deadline.day < today.day:
                months_left -= 1
            months_left = max(0, months_left)
            if months_left == 0:
                # Less than a calendar month left: the remaining amount is still due, so ask this month.
                months_left = 1
            else:
                deadline_note = None
        if months_left > 0:
            monthly_needed = money(-(-remaining // months_left))  # ceil to sen
    completed = remaining == 0 or goal.status == "completed"
    return {
        "id": goal.id,
        "title": goal.title,
        "target_amount": money(target),
        "saved_amount": money(saved),
        "remaining_amount": money(remaining),
        "deadline": goal.deadline.isoformat() if goal.deadline else None,
        "months_remaining": months_left,
        "monthly_needed": monthly_needed,
        "percent_complete": percent,
        "status": "completed" if completed else goal.status,
        "deadline_note": deadline_note,
    }


def dashboard(db: Session, user: User, month: date) -> dict[str, Any]:
    summary = month_summary(db, user.id, month)
    budgets = budget_rows(db, user.id, month)
    goals = [goal_progress(g) for g in db.scalars(
        select(SavingsGoal).where(SavingsGoal.user_id == user.id).order_by(SavingsGoal.created_at.desc())
    )]

    trend = []
    for offset in range(5, -1, -1):
        m = month
        for _ in range(offset):
            m = date(m.year - (m.month == 1), 12 if m.month == 1 else m.month - 1, 1)
        inc = _txn_sum(db, user.id, m, month_end(m), "income")
        exp = _net_expenses(db, user.id, m, month_end(m))
        trend.append({
            "month": f"{m.year:04d}-{m.month:02d}",
            "label": month_label(m, user.locale)[:3],
            "income": money(inc),
            "expenses": money(exp),
            "income_minor": inc,
            "expenses_minor": exp,
        })

    recent = db.execute(
        select(Transaction, Category)
        .join(Category, Transaction.category_id == Category.id)
        .where(Transaction.user_id == user.id)
        .order_by(Transaction.transaction_date.desc(), Transaction.created_at.desc())
        .limit(5)
    ).all()

    warnings = [
        {
            "budget_id": b["id"],
            "category_name": b["category_name"],
            "state": b["state"],
            "percent_used": b["percent_used"],
            "remaining": b["remaining"],
            "overspend": b["overspend"],
        }
        for b in budgets if b["state"] in ("warning", "reached", "over")
    ]
    top = summary["categories"][0] if summary["categories"] else None
    return {
        **summary,
        "budgets": budgets,
        "warnings": warnings,
        "trend": trend,
        "goals": goals,
        "top_category": top,
        "recent_transactions": [
            {
                "id": t.id,
                "type": t.type,
                "amount": money(t.amount_minor),
                "category": c.name,
                "date": t.transaction_date.isoformat(),
                "description": t.description,
                "is_refund": t.is_refund,
            }
            for t, c in recent
        ],
        "currency": "MYR",
        "timezone": "Asia/Kuala_Lumpur",
    }


def _dec(value: str | Decimal | int | None) -> Decimal:
    if value is None:
        return Decimal("0")
    return Decimal(str(value))


def simulate(payload: dict[str, Any], profile_income_minor: int | None = None) -> dict[str, Any]:
    """Deterministic cash-flow projection with explicit assumptions."""
    income = _dec(payload.get("monthly_income"))
    if payload.get("use_profile_income") and profile_income_minor:
        income = Decimal(profile_income_minor) / 100
    expenses = _dec(payload.get("monthly_expenses"))
    income_change = _dec(payload.get("income_change", "0"))
    expense_reduction = _dec(payload.get("expense_reduction", "0"))
    new_expense = _dec(payload.get("new_recurring_expense", "0"))
    savings = _dec(payload.get("savings_contribution", "0"))
    one_off = _dec(payload.get("one_off_purchase", "0"))
    months = int(payload.get("months") or 6)

    if income < 0 or expenses < 0:
        raise ValueError("Income and expenses cannot be negative")
    if new_expense < 0 or savings < 0 or one_off < 0:
        raise ValueError("New expenses, savings and purchases cannot be negative")
    if expense_reduction < 0:
        raise ValueError("Expense reduction cannot be negative")
    if expense_reduction > expenses:
        raise ValueError("Expense reduction cannot exceed current expenses")

    baseline = income - expenses
    # expense_reduction increases the surplus; savings is a commitment, so it reduces free balance.
    proposed = baseline + income_change + expense_reduction - new_expense - savings
    delta = proposed - baseline
    monthly_one_off = (one_off / months).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    series = []
    running = Decimal("0")
    for i in range(1, months + 1):
        # One-off purchases land in month 1 unless the user spreads them.
        month_flow = proposed - (one_off if i == 1 else Decimal("0"))
        running += month_flow
        series.append({"month": i, "flow": str(month_flow.quantize(Decimal("0.01"))),
                       "cumulative": str(running.quantize(Decimal("0.01")))})

    q = lambda d: str(d.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))  # noqa: E731
    assumptions = [
        "Income and listed expenses stay the same for the whole period",
        "Figures are monthly MYR amounts; one-off purchases are counted in month 1",
        "This is a hypothetical projection, not a guarantee or financial advice",
    ]
    if savings > 0:
        assumptions.append("Savings contribution is treated as money that leaves your spending balance")
    if monthly_one_off > 0 and one_off > 0:
        assumptions.append(f"One-off RM{monthly_one_off} per month if you spread it across {months} months")

    return {
        "currency": "MYR",
        "months": months,
        "monthly_income": q(income),
        "monthly_expenses": q(expenses),
        "income_change": q(income_change),
        "expense_reduction": q(expense_reduction),
        "new_recurring_expense": q(new_expense),
        "savings_contribution": q(savings),
        "one_off_purchase": q(one_off),
        "baseline_balance": q(baseline),
        "projected_balance": q(proposed),
        "monthly_delta": q(delta),
        "total_proposed": q(proposed * months),
        "series": series,
        "assumptions": assumptions,
        "hypothetical": True,
    }


def goal_required_monthly(target_minor: int, saved_minor: int, months_remaining: int) -> dict[str, Any]:
    if months_remaining <= 0:
        return {"ok": False, "error": "No valid time remaining before the deadline",
                "remaining_amount": money(max(0, target_minor - saved_minor)), "monthly_needed": None}
    remaining = max(0, target_minor - saved_minor)
    return {"ok": True, "remaining_amount": money(remaining), "months_remaining": months_remaining,
            "monthly_needed": money(-(-remaining // months_remaining))}


def sum_minor(values: Iterable[int]) -> int:
    return sum(int(v) for v in values)
