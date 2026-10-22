"""Pydantic request/response models. Money crosses the wire as a decimal string."""
from __future__ import annotations

import re
from datetime import date
from decimal import Decimal, InvalidOperation
from typing import Any, Literal, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

TxnType = Literal["income", "expense"]
MONTH_RE = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")
MAX_AMOUNT_MINOR = 100_000_000_00  # RM100,000,000 guardrail


def to_minor(value: Any) -> int:
    """Parse a positive MYR amount into integer cents without float drift."""
    if isinstance(value, int) and not isinstance(value, bool):
        dec = Decimal(value)
    elif isinstance(value, str):
        try:
            dec = Decimal(value.strip())
        except (InvalidOperation, ArithmeticError) as exc:
            raise ValueError("Amount must be a number") from exc
    elif isinstance(value, Decimal):
        dec = value
    else:
        raise ValueError("Amount must be a number")
    if not dec.is_finite():
        raise ValueError("Amount must be a finite number")
    minor = int((dec * 100).quantize(Decimal("1")))
    if minor <= 0:
        raise ValueError("Amount must be greater than zero")
    if minor > MAX_AMOUNT_MINOR:
        raise ValueError("Amount is above the supported limit")
    return minor


def to_minor_nonneg(value: Any) -> int:
    """Parse an amount that may legitimately be zero (budget limits, saved amounts)."""
    try:
        dec = Decimal(str(value).strip())
    except (InvalidOperation, ArithmeticError) as exc:
        raise ValueError("Amount must be a number") from exc
    if not dec.is_finite():
        raise ValueError("Amount must be a finite number")
    if dec < 0:
        raise ValueError("Amount cannot be negative")
    minor = int((dec * 100).quantize(Decimal("1")))
    if minor > MAX_AMOUNT_MINOR:
        raise ValueError("Amount is above the supported limit")
    return minor


def from_minor(minor: int) -> str:
    sign = "-" if minor < 0 else ""
    minor = abs(int(minor))
    return f"{sign}{minor // 100}.{minor % 100:02d}"


def parse_month(month: str | None) -> date | None:
    if not month:
        return None
    if not MONTH_RE.match(month):
        raise ValueError("month must look like YYYY-MM")
    year, mon = month.split("-")
    return date(int(year), int(mon), 1)


# ---------------------------------------------------------------- auth
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=1, max_length=80)
    locale: Literal["en", "bm"] = "en"
    monthly_income: Optional[str] = None
    load_demo_data: bool = False

    @field_validator("password")
    @classmethod
    def password_ok(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("monthly_income")
    @classmethod
    def income_ok(cls, v: str | None) -> str | None:
        if v in (None, ""):
            return None
        to_minor(v)
        return v


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class ProfileIn(BaseModel):
    display_name: Optional[str] = Field(default=None, min_length=1, max_length=80)
    locale: Optional[Literal["en", "bm"]] = None
    monthly_income: Optional[str] = None
    password: Optional[str] = Field(default=None, min_length=8, max_length=128)
    current_password: Optional[str] = None

    @field_validator("monthly_income")
    @classmethod
    def income_ok(cls, v: str | None) -> str | None:
        if v in (None, ""):
            return None
        to_minor(v)
        return v


# ---------------------------------------------------------------- categories
class CategoryIn(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    type: TxnType
    icon: str = Field(default="dot", max_length=24)


# ---------------------------------------------------------------- transactions
class TransactionIn(BaseModel):
    type: TxnType
    amount: str
    category_id: str
    transaction_date: date
    description: Optional[str] = Field(default=None, max_length=500)
    merchant: Optional[str] = Field(default=None, max_length=120)
    is_refund: bool = False

    @field_validator("amount")
    @classmethod
    def amount_ok(cls, v: str) -> str:
        to_minor(v)
        return v

    @field_validator("transaction_date")
    @classmethod
    def date_ok(cls, v: date) -> date:
        if v.year < 2000 or v.year > 2100:
            raise ValueError("Date is outside the supported range")
        return v

    @model_validator(mode="after")
    def refund_rules(self):
        if self.is_refund:
            # Refunds are stored as income-like offsets and must be expenses.
            if self.type != "expense":
                raise ValueError("A refund must reference an expense category")
        return self


class TransactionUpdate(BaseModel):
    type: Optional[TxnType] = None
    amount: Optional[str] = None
    category_id: Optional[str] = None
    transaction_date: Optional[date] = None
    description: Optional[str] = Field(default=None, max_length=500)
    merchant: Optional[str] = Field(default=None, max_length=120)

    @field_validator("amount")
    @classmethod
    def amount_ok(cls, v: str | None) -> str | None:
        if v is None:
            return None
        to_minor(v)
        return v


# ---------------------------------------------------------------- budgets
class BudgetIn(BaseModel):
    category_id: str
    month: str
    limit: str

    @field_validator("month")
    @classmethod
    def month_ok(cls, v: str) -> str:
        parse_month(v)
        return v

    @field_validator("limit")
    @classmethod
    def limit_ok(cls, v: str) -> str:
        to_minor_nonneg(v)
        return v


class BudgetUpdate(BaseModel):
    limit: str

    @field_validator("limit")
    @classmethod
    def limit_ok(cls, v: str) -> str:
        to_minor_nonneg(v)
        return v


# ---------------------------------------------------------------- goals
class GoalIn(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    target_amount: str
    saved_amount: str = "0.00"
    deadline: Optional[date] = None

    @field_validator("target_amount")
    @classmethod
    def target_ok(cls, v: str) -> str:
        to_minor(v)
        return v

    @field_validator("saved_amount")
    @classmethod
    def saved_ok(cls, v: str) -> str:
        to_minor_nonneg(v)
        return v


class GoalUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=120)
    target_amount: Optional[str] = None
    saved_amount: Optional[str] = None
    deadline: Optional[date] = None
    status: Optional[Literal["active", "completed"]] = None


class ContributionIn(BaseModel):
    amount: str

    @field_validator("amount")
    @classmethod
    def amount_ok(cls, v: str) -> str:
        to_minor(v)
        return v


# ---------------------------------------------------------------- simulation
class SimulationIn(BaseModel):
    monthly_income: Optional[str] = None
    monthly_expenses: Optional[str] = None
    income_change: str = "0.00"
    expense_reduction: str = "0.00"
    new_recurring_expense: str = "0.00"
    savings_contribution: str = "0.00"
    one_off_purchase: str = "0.00"
    months: int = Field(default=6, ge=1, le=60)
    title: Optional[str] = Field(default=None, max_length=120)
    use_profile_income: bool = False
    save: bool = False

    @field_validator(
        "expense_reduction", "new_recurring_expense", "savings_contribution", "one_off_purchase"
    )
    @classmethod
    def non_negative_amount(cls, v: str) -> str:
        dec = Decimal(str(v))
        if not dec.is_finite():
            raise ValueError("Amount must be a finite number")
        if dec < 0:
            raise ValueError("This amount cannot be negative")
        return v

    @field_validator("monthly_income", "monthly_expenses")
    @classmethod
    def optional_amount(cls, v: str | None) -> str | None:
        if v in (None, ""):
            return None
        dec = Decimal(str(v))
        if dec < 0:
            raise ValueError("Amount cannot be negative")
        (dec * 100).quantize(Decimal("1"))
        return v

    @field_validator(
        "income_change", "expense_reduction", "new_recurring_expense", "savings_contribution", "one_off_purchase"
    )
    @classmethod
    def signed_amount(cls, v: str) -> str:
        dec = Decimal(str(v))
        if not dec.is_finite():
            raise ValueError("Amount must be a finite number")
        (dec * 100).quantize(Decimal("1"))
        return v


# ---------------------------------------------------------------- AI
class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    conversation_id: Optional[str] = None
    locale: Optional[Literal["en", "bm"]] = None


class AnalyzeIn(BaseModel):
    month: Optional[str] = None
    locale: Optional[Literal["en", "bm"]] = None

    @field_validator("month")
    @classmethod
    def month_ok(cls, v: str | None) -> str | None:
        if v:
            parse_month(v)
        return v


class AdminUserPatch(BaseModel):
    status: Literal["active", "disabled"]


def money(minor: int | None) -> str:
    return from_minor(minor or 0)


__all__ = [
    "RegisterIn", "LoginIn", "ProfileIn", "CategoryIn", "TransactionIn", "TransactionUpdate",
    "BudgetIn", "BudgetUpdate", "GoalIn", "GoalUpdate", "ContributionIn", "SimulationIn",
    "ChatIn", "AnalyzeIn", "AdminUserPatch", "to_minor", "from_minor", "parse_month", "money",
    "Any",
]
