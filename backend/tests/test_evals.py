"""Release-gate cases from docs/EVALS.md that can be checked without a provider.

Cases needing the live Flowise flow are reported as skipped with the reason, so the gate is
visible rather than quietly passing.
"""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.services import ai, finance

CASES = json.loads((Path(__file__).resolve().parents[2] / "evals" / "cases.json").read_text(encoding="utf-8"))["cases"]
DETERMINISTIC = [case for case in CASES if "deterministic" in case]
PROVIDER = [case for case in CASES if case.get("requires_provider")]


def test_every_case_is_classified():
    assert CASES
    assert len(DETERMINISTIC) + len(PROVIDER) == len(CASES)


@pytest.mark.parametrize("case", DETERMINISTIC, ids=[case["id"] for case in DETERMINISTIC])
def test_deterministic_case(case):
    kind = case["deterministic"]
    params = case.get("params", {})
    expected = case.get("expected", {})

    if kind in ("simulate_balance", "simulate_series"):
        result = finance.simulate({
            "monthly_income": params.get("income", "0"),
            "monthly_expenses": params.get("expenses", "0"),
            "new_recurring_expense": params.get("new_recurring_expense", "0.00"),
            "expense_reduction": params.get("expense_reduction", "0.00"),
            "months": params.get("months", 6),
        })
        for key in ("baseline_balance", "projected_balance"):
            if key in expected:
                assert result[key] == expected[key], f"{case['id']} {key}"
        if "cumulative_after_6" in expected:
            assert result["series"][-1]["cumulative"] == expected["cumulative_after_6"]

    elif kind == "budget_overspend":
        spent_minor = int(round(float(params["spent"]) * 100))
        limit_minor = int(round(float(params["limit"]) * 100))
        overspend = spent_minor - limit_minor
        percent = round(spent_minor / limit_minor * 100, 2)
        assert finance.money(overspend) == expected["overspend"]
        assert percent == expected["percent_used"]

    elif kind == "empty_month":
        text = ai.deterministic_brief({"has_data": False})
        assert "No transactions" in text

    else:  # pragma: no cover - guards against silent additions
        pytest.fail(f"unknown deterministic case type {kind}")


@pytest.mark.skip(reason="needs the live Flowise flow; run manually with AI configured")
@pytest.mark.parametrize("case", PROVIDER, ids=[case["id"] for case in PROVIDER])
def test_provider_case_placeholder(case):
    assert case["expected"]
