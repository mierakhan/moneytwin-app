"""P0 correctness: one overspending total, unbudgeted spending, safe percent changes."""
from __future__ import annotations

from datetime import date


def _cat(client, name: str) -> str:
    cats = client.get("/api/auth/categories").json()["categories"]
    return next(c["id"] for c in cats if c["name"] == name and c["type"] == "expense")


def _spend(client, token, name: str, amount: str, day: str = "2026-10-09"):
    return client.post("/api/transactions", headers={"X-CSRF-Token": token}, json={
        "type": "expense", "amount": amount, "category_id": _cat(client, name),
        "transaction_date": day,
    })


def _budget(client, token, name: str, limit: str, month: str = "2026-10"):
    return client.post("/api/budgets", headers={"X-CSRF-Token": token}, json={
        "category_id": _cat(client, name), "month": month, "limit": limit,
    })


def test_overspending_total_sums_every_over_budget_category(user_client):
    c = user_client["client"]
    token = user_client["csrf"]
    _budget(c, token, "Food", "400.00")
    _budget(c, token, "Shopping", "300.00")
    _spend(c, token, "Food", "1500.00")
    _spend(c, token, "Shopping", "400.00")

    dash = c.get("/api/dashboard?month=2026-10").json()
    # Food is 1,100 over and Shopping 100 over: the total must be 1,200, not the top category.
    assert dash["overspending_total"] == "1200.00"
    assert [row["category_name"] for row in dash["over_budgets"]] == ["Food", "Shopping"]
    assert [row["overspend"] for row in dash["over_budgets"]] == ["1100.00", "100.00"]

    summary = c.get("/api/budgets/summary?month=2026-10").json()
    assert summary["overspending_total"] == "1200.00"


def test_insights_and_dashboard_agree_on_overspending(user_client):
    c = user_client["client"]
    token = user_client["csrf"]
    _budget(c, token, "Food", "400.00")
    _budget(c, token, "Transport", "250.00")
    _spend(c, token, "Food", "600.00")
    _spend(c, token, "Transport", "300.00")

    dash = c.get("/api/dashboard?month=2026-10").json()
    brief = c.post("/api/ai/brief", headers={"X-CSRF-Token": token},
                   json={"month": "2026-10", "locale": "en"}).json()
    assert dash["overspending_total"] == "250.00"
    assert "250.00" in brief["summary"] or "250.00" in " ".join(brief["findings"])


def test_unbudgeted_spending_is_separate(user_client):
    c = user_client["client"]
    token = user_client["csrf"]
    _budget(c, token, "Food", "400.00")
    _spend(c, token, "Food", "100.00")
    _spend(c, token, "Entertainment", "75.00")

    dash = c.get("/api/dashboard?month=2026-10").json()
    assert [row["category_name"] for row in dash["unbudgeted"]] == ["Entertainment"]
    assert dash["unbudgeted"][0]["spent"] == "75.00"
    # A category with no budget must not appear as an over-budget row.
    assert all(row["category_name"] != "Entertainment" for row in dash["over_budgets"])


def test_percent_change_is_null_when_previous_month_empty(user_client):
    c = user_client["client"]
    _spend(c, user_client["csrf"], "Food", "50.00")
    change = c.get("/api/dashboard?month=2026-10").json()["previous"]["expenses_change"]
    assert change["percent"] is None
    assert change["delta"] == "50.00"
    assert change["direction"] == "up"


def test_month_boundary_last_and_first_day(user_client):
    c = user_client["client"]
    token = user_client["csrf"]
    _spend(c, token, "Food", "10.00", "2026-10-31")
    _spend(c, token, "Food", "20.00", "2026-11-01")
    october = c.get("/api/dashboard?month=2026-10").json()
    november = c.get("/api/dashboard?month=2026-11").json()
    assert october["expenses"] == "10.00"
    assert november["expenses"] == "20.00"


def test_chat_rejects_overlong_message(user_client):
    r = user_client["client"].post("/api/ai/chat", headers={"X-CSRF-Token": user_client["csrf"]},
                                   json={"message": "x" * 1005})
    assert r.status_code == 422


def test_transactions_and_dashboard_reconcile(user_client):
    c = user_client["client"]
    token = user_client["csrf"]
    _spend(c, token, "Food", "33.33")
    _spend(c, token, "Food", "66.67")
    dash = c.get("/api/dashboard?month=2026-10").json()
    ledger = c.get("/api/transactions?month=2026-10&limit=100").json()["items"]
    assert dash["expenses"] == "100.00"
    assert round(sum(float(item["amount"]) for item in ledger), 2) == 100.00


def test_money_rounds_to_sen(user_client):
    c = user_client["client"]
    token = user_client["csrf"]
    _spend(c, token, "Food", "0.015")
    dash = c.get("/api/dashboard?month=2026-10").json()
    # 0.015 rounds to 2 sen, never a repeating float.
    assert dash["expenses"] in ("0.01", "0.02")


def test_month_with_no_records_is_distinguishable(user_client):
    c = user_client["client"]
    body = c.get("/api/history?months=1").json()["rows"][0]
    if not body["has_data"]:
        assert body["transaction_count"] == 0
