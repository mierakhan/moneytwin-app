"""Business-rule tests: ledger, budgets, simulation, goals (FIN/SIM/GOAL cases)."""
from __future__ import annotations

from datetime import date, timedelta

from .conftest import csrf


def _cat(client, name: str, type_: str = "expense") -> str:
    cats = client.get("/api/auth/categories").json()["categories"]
    return next(c["id"] for c in cats if c["name"] == name and c["type"] == type_)


def _add(client, csrf_token, amount: str, category: str, day: str, type_="expense", description=None):
    return client.post("/api/transactions", headers={"X-CSRF-Token": csrf_token}, json={
        "type": type_,
        "amount": amount,
        "category_id": _cat(client, category, type_),
        "transaction_date": day,
        "description": description,
    })


def test_fin01_ledger_totals_with_cents(user_client):
    c = user_client["client"]
    token = user_client["csrf"]
    r = _add(c, token, "12.50", "Food", "2026-10-05")
    assert r.status_code == 201, r.text
    assert r.json()["amount"] == "12.50"
    r = _add(c, token, "100.00", "Salary", "2026-10-01", type_="income")
    assert r.status_code == 201

    dash = c.get("/api/dashboard?month=2026-10").json()
    assert dash["income"] == "100.00"
    assert dash["expenses"] == "12.50"
    assert dash["balance"] == "87.50"


def test_fin02_negative_amount_rejected(user_client):
    c = user_client["client"]
    r = _add(c, user_client["csrf"], "-20.00", "Food", "2026-10-05")
    assert r.status_code == 422
    assert c.get("/api/transactions").json()["total"] == 0


def test_fin03_budget_remaining_and_percent(user_client):
    c = user_client["client"]
    token = user_client["csrf"]
    food = _cat(c, "Food")
    r = c.post("/api/budgets", headers={"X-CSRF-Token": token},
               json={"category_id": food, "month": "2026-10", "limit": "500.00"})
    assert r.status_code == 201, r.text
    _add(c, token, "200.00", "Food", "2026-10-04")
    rows = c.get("/api/budgets/summary?month=2026-10").json()["budgets"]
    row = next(b for b in rows if b["category_name"] == "Food")
    assert row["remaining"] == "300.00"
    assert row["percent_used"] == 40.0
    assert row["state"] == "ok"


def test_fin04_overspend_200(user_client):
    c = user_client["client"]
    token = user_client["csrf"]
    food = _cat(c, "Food")
    c.post("/api/budgets", headers={"X-CSRF-Token": token},
           json={"category_id": food, "month": "2026-10", "limit": "400.00"})
    _add(c, token, "600.00", "Food", "2026-10-09")
    row = next(b for b in c.get("/api/budgets?month=2026-10").json()["budgets"]
               if b["category_name"] == "Food")
    assert row["overspend"] == "200.00"
    assert row["percent_used"] == 150.0
    assert row["state"] == "over"
    assert row["remaining"] == "-200.00"


def test_fin05_month_boundary(user_client):
    c = user_client["client"]
    token = user_client["csrf"]
    _add(c, token, "100.00", "Food", "2026-10-31")
    _add(c, token, "70.00", "Food", "2026-11-01")
    assert c.get("/api/dashboard?month=2026-10").json()["expenses"] == "100.00"
    assert c.get("/api/dashboard?month=2026-11").json()["expenses"] == "70.00"


def test_budget_duplicate_updates_instead_of_duplicating(user_client):
    c = user_client["client"]
    token = user_client["csrf"]
    food = _cat(c, "Food")
    first = c.post("/api/budgets", headers={"X-CSRF-Token": token},
                   json={"category_id": food, "month": "2026-10", "limit": "300.00"})
    second = c.post("/api/budgets", headers={"X-CSRF-Token": token},
                    json={"category_id": food, "month": "2026-10", "limit": "450.00"})
    assert first.status_code == 201 and second.status_code == 201
    assert second.json()["updated"] is True
    assert second.json()["budget"]["limit"] == "450.00"
    assert len(c.get("/api/budgets?month=2026-10").json()["budgets"]) == 1


def test_budget_negative_limit_rejected(user_client):
    c = user_client["client"]
    r = c.post("/api/budgets", headers={"X-CSRF-Token": user_client["csrf"]},
               json={"category_id": _cat(c, "Food"), "month": "2026-10", "limit": "-50"})
    assert r.status_code == 422


def test_sim01_baseline_and_projection(user_client):
    c = user_client["client"]
    r = c.post("/api/simulations/calculate", headers={"X-CSRF-Token": user_client["csrf"]}, json={
        "monthly_income": "2500.00", "monthly_expenses": "1600.00",
        "new_recurring_expense": "300.00", "months": 6,
    })
    assert r.status_code == 200, r.text
    result = r.json()["result"]
    assert result["baseline_balance"] == "900.00"
    assert result["projected_balance"] == "600.00"
    assert result["monthly_delta"] == "-300.00"
    assert result["assumptions"]


def test_sim02_simulation_does_not_mutate_ledger(user_client):
    c = user_client["client"]
    token = user_client["csrf"]
    _add(c, token, "250.00", "Food", "2026-10-08")
    before = c.get("/api/dashboard?month=2026-10").json()
    c.post("/api/simulations/calculate", headers={"X-CSRF-Token": token}, json={
        "monthly_income": "2500.00", "monthly_expenses": "1600.00", "new_recurring_expense": "300.00",
    })
    after = c.get("/api/dashboard?month=2026-10").json()
    assert before["expenses"] == after["expenses"]
    assert before["balance"] == after["balance"]
    assert c.get("/api/transactions").json()["total"] == 1


def test_sim_rejects_negative_expense_reduction(user_client):
    c = user_client["client"]
    r = c.post("/api/simulations/calculate", headers={"X-CSRF-Token": user_client["csrf"]}, json={
        "monthly_income": "2500.00", "monthly_expenses": "1600.00", "expense_reduction": "-500.00",
    })
    assert r.status_code == 422


def test_goal01_required_monthly(user_client):
    c = user_client["client"]
    token = user_client["csrf"]
    deadline = (date.today() + timedelta(days=183)).isoformat()
    r = c.post("/api/goals", headers={"X-CSRF-Token": token}, json={
        "title": "Laptop fund", "target_amount": "2400.00", "saved_amount": "600.00", "deadline": deadline,
    })
    assert r.status_code == 201, r.text
    goal = r.json()
    assert goal["months_remaining"] == 6
    assert goal["monthly_needed"] == "300.00"


def test_goal02_past_deadline_is_safe(user_client):
    c = user_client["client"]
    token = user_client["csrf"]
    r = c.post("/api/goals", headers={"X-CSRF-Token": token}, json={
        "title": "Late goal", "target_amount": "1000.00", "saved_amount": "100.00",
        "deadline": "2020-01-01",
    })
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["months_remaining"] == 0
    assert body["monthly_needed"] is None
    assert body["deadline_note"] == "overdue"


def test_goal_contribution_cannot_exceed_target(user_client):
    c = user_client["client"]
    token = user_client["csrf"]
    g = c.post("/api/goals", headers={"X-CSRF-Token": token}, json={
        "title": "Small", "target_amount": "100.00", "saved_amount": "90.00",
    }).json()
    too_much = c.post(f"/api/goals/{g['id']}/contribute", headers={"X-CSRF-Token": token},
                      json={"amount": "20.00"})
    assert too_much.status_code == 400
    ok = c.post(f"/api/goals/{g['id']}/contribute", headers={"X-CSRF-Token": token},
                json={"amount": "10.00"})
    assert ok.status_code == 200 and ok.json()["status"] == "completed"


def test_refund_reduces_category_spend(user_client):
    c = user_client["client"]
    token = user_client["csrf"]
    food = _cat(c, "Food")
    c.post("/api/transactions", headers={"X-CSRF-Token": token}, json={
        "type": "expense", "amount": "80.00", "category_id": food,
        "transaction_date": "2026-10-10", "description": "Groceries",
    })
    r = c.post("/api/transactions", headers={"X-CSRF-Token": token}, json={
        "type": "expense", "amount": "30.00", "category_id": food,
        "transaction_date": "2026-10-11", "description": "Refund", "is_refund": True,
    })
    assert r.status_code == 201
    dash = c.get("/api/dashboard?month=2026-10").json()
    assert dash["expenses"] == "50.00"


def test_duplicate_transaction_blocked(user_client):
    c = user_client["client"]
    token = user_client["csrf"]
    _add(c, token, "12.50", "Food", "2026-10-05", description="Lunch")
    dup = _add(c, token, "12.50", "Food", "2026-10-05", description="Lunch")
    assert dup.status_code == 409


def test_csrf_required_for_mutations(user_client):
    c = user_client["client"]
    r = c.post("/api/transactions", json={
        "type": "expense", "amount": "10.00", "category_id": _cat(c, "Food"),
        "transaction_date": "2026-10-05",
    })
    assert r.status_code == 403
