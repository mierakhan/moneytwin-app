"""Fictional demo data. No real people, no real finances."""
from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Budget, Category, SavingsGoal, Transaction, User
from ..schemas import to_minor
from .finance import month_start

SYSTEM_CATEGORIES: list[tuple[str, str, str]] = [
    ("Salary", "income", "wallet"),
    ("Allowance", "income", "gift"),
    ("Freelance", "income", "laptop"),
    ("Other income", "income", "plus"),
    ("Food", "expense", "utensils"),
    ("Rent", "expense", "home"),
    ("Transport", "expense", "bus"),
    ("Utilities", "expense", "bolt"),
    ("Shopping", "expense", "bag"),
    ("Health", "expense", "heart"),
    ("Education", "expense", "book"),
    ("Entertainment", "expense", "music"),
    ("Other", "expense", "dot"),
]

DEMO_EMAIL = "demo@moneytwin.my"
DEMO_PASSWORD = "Demo1234!"


def ensure_categories(db: Session, user: User) -> dict[str, Category]:
    existing = {c.name.lower(): c for c in db.scalars(select(Category).where(Category.user_id == user.id))}
    for name, type_, icon in SYSTEM_CATEGORIES:
        key = name.lower()
        if key not in existing:
            cat = Category(user_id=user.id, name=name, type=type_, icon=icon, is_system=True)
            db.add(cat)
            existing[key] = cat
    db.flush()
    return existing


def seed_user_data(db: Session, user: User, *, include_history: bool = True) -> None:
    """RM2,500 income, RM1,600 expenses, RM900 balance, one active goal."""
    cats = ensure_categories(db, user)
    month = month_start()
    user.monthly_income_minor = to_minor("2500.00")
    if user.locale not in ("en", "bm"):
        user.locale = "en"

    has_txns = db.scalar(select(Transaction.id).where(Transaction.user_id == user.id).limit(1))
    if has_txns:
        db.commit()
        return

    def add(type_: str, amount: str, category: str, day: int, description: str, merchant: str | None = None):
        db.add(Transaction(
            user_id=user.id,
            type=type_,
            amount_minor=to_minor(amount),
            category_id=cats[category.lower()].id,
            transaction_date=date(month.year, month.month, min(day, 28)),
            description=description,
            merchant=merchant,
        ))

    add("income", "2500.00", "Salary", 1, "Monthly salary (fictional)")
    add("expense", "600.00", "Rent", 1, "Room rental (fictional)", "Taman Setia")
    add("expense", "120.00", "Food", 4, "Groceries", "Pasar Mini")
    add("expense", "150.00", "Food", 12, "Mamak meals", "Restoran Ali")
    add("expense", "180.00", "Food", 20, "Groceries and lunches", "Mydin")
    add("expense", "90.00", "Transport", 6, "LRT and bus reload", "RapidKL")
    add("expense", "110.00", "Transport", 18, "Petrol", "Petronas")
    add("expense", "350.00", "Other", 15, "Phone, internet and misc (fictional)")

    existing_budgets = {b.category_id for b in db.scalars(select(Budget).where(Budget.user_id == user.id, Budget.month == month))}
    for cat_name, limit in (("Food", "400.00"), ("Rent", "600.00"), ("Transport", "250.00"), ("Other", "400.00")):
        cat = cats[cat_name.lower()]
        if cat.id not in existing_budgets:
            db.add(Budget(user_id=user.id, category_id=cat.id, month=month, limit_minor=to_minor(limit)))

    if not db.scalar(select(SavingsGoal.id).where(SavingsGoal.user_id == user.id).limit(1)):
        db.add(SavingsGoal(
            user_id=user.id,
            title="Emergency fund",
            target_minor=to_minor("2400.00"),
            saved_minor=to_minor("600.00"),
            deadline=date(month.year + (month.month + 5) // 12, (month.month + 5) % 12 + 1, 15),
            status="active",
        ))

    if include_history:
        prev = date(month.year - (month.month == 1), 12 if month.month == 1 else month.month - 1, 1)
        db.add(Transaction(
            user_id=user.id, type="income", amount_minor=to_minor("2500.00"),
            category_id=cats["salary"].id, transaction_date=prev,
            description="Monthly salary (fictional, previous month)",
        ))
        for amount, cat, day in (("600.00", "rent", 1), ("430.00", "food", 9), ("210.00", "transport", 11), ("330.00", "other", 17)):
            db.add(Transaction(
                user_id=user.id, type="expense", amount_minor=to_minor(amount),
                category_id=cats[cat].id,
                transaction_date=date(prev.year, prev.month, day),
                description="Previous month (fictional)",
            ))

    db.commit()


def reset_demo_data(db: Session, user: User) -> None:
    for model in (Transaction, Budget, SavingsGoal):
        for row in db.scalars(select(model).where(model.user_id == user.id)):
            db.delete(row)
    db.commit()
    seed_user_data(db, user)
