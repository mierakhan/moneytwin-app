"""AI grounding rules: the model may not quote figures that are not in verified data."""
from __future__ import annotations

from app.services import ai

CONTEXT = {
    "period": "2026-10",
    "period_label": "October 2026",
    "currency": "MYR",
    "locale": "en",
    "income": "2500.00",
    "expenses": "1600.00",
    "balance": "900.00",
    "categories": [{"name": "Food", "amount": "600.00"}, {"name": "Rent", "amount": "600.00"}],
    "budgets": [
        {"category": "Food", "limit": "400.00", "spent": "600.00", "remaining": "-200.00",
         "percent_used": 150.0, "state": "over"},
    ],
    "goals": [{"title": "Laptop", "target": "2400.00", "saved": "600.00", "remaining": "1800.00",
               "months_remaining": 6, "monthly_needed": "300.00", "status": "active"}],
    "previous_months": [],
    "recent_transactions": [],
    "has_data": True,
}


def test_verified_amounts_pass():
    ok, bad = ai.validate_reply("You spent RM600.00 on food against a RM400.00 budget.", CONTEXT)
    assert ok and bad == []


def test_invented_amount_is_rejected():
    ok, bad = ai.validate_reply("You spent RM4,321.00 on food this month.", CONTEXT)
    assert not ok
    assert "4,321.00" in bad


def test_user_supplied_amount_is_allowed():
    ok, _ = ai.validate_reply("Adding RM300.00 a month would leave RM600.00.",
                              CONTEXT, extra_text="Can I afford RM300 extra each month?")
    assert ok


def test_arithmetic_between_verified_values_is_allowed():
    ok, bad = ai.validate_reply("RM900.00 minus RM300.00 leaves RM600.00.", CONTEXT,
                                extra_text="RM300")
    assert ok, bad


def test_budget_math_example_from_spec():
    ok, bad = ai.validate_reply("Food is RM200.00 over its RM400.00 budget (150% used).", CONTEXT)
    assert ok, bad


def test_brief_without_data_is_honest():
    text = ai.deterministic_brief({**CONTEXT, "has_data": False})
    assert "No transactions" in text


def test_brief_reports_overspend():
    text = ai.deterministic_brief(CONTEXT)
    assert "RM600.00" in text and "over budget" in text.lower()
