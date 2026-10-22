"""Monthly history and short AI brief."""
from __future__ import annotations


def _cat(client, name: str) -> str:
    cats = client.get("/api/auth/categories").json()["categories"]
    return next(c["id"] for c in cats if c["name"] == name and c["type"] == "expense")


def _add(client, token, month_day: str, amount: str, name: str = "Food", type_="expense"):
    return client.post("/api/transactions", headers={"X-CSRF-Token": token}, json={
        "type": type_,
        "amount": amount,
        "category_id": _cat(client, name),
        "transaction_date": month_day,
    })


def test_history_returns_requested_window(user_client):
    c = user_client["client"]
    token = user_client["csrf"]
    _add(c, token, "2026-09-10", "100.00")
    _add(c, token, "2026-10-10", "250.00")

    res = c.get("/api/history?months=3")
    assert res.status_code == 200
    rows = res.json()["rows"]
    assert len(rows) == 3
    by_month = {r["month"]: r for r in rows}
    assert by_month["2026-09"]["expenses"] == "100.00"
    assert by_month["2026-10"]["expenses"] == "250.00"
    assert by_month["2026-10"]["has_data"] is True
    # Months without rows are reported honestly, never filled with invented numbers.
    empty = [r for r in rows if not r["has_data"]]
    assert all(r["expenses"] == "0.00" for r in empty)


def test_history_change_is_computed_month_over_month(user_client):
    c = user_client["client"]
    token = user_client["csrf"]
    _add(c, token, "2026-09-05", "200.00")
    _add(c, token, "2026-10-05", "100.00")

    rows = c.get("/api/history?months=2").json()["rows"]
    october = rows[-1]
    assert october["expenses_change"]["delta"] == "-100.00"
    assert october["expenses_change"]["direction"] == "down"
    assert october["expenses_change"]["percent"] == -50.0


def test_history_is_user_scoped(user_client, other_client):
    c = user_client["client"]
    # Both fixtures share this client's cookie jar, so start as the first owner.
    c.post("/api/auth/login", json={"email": user_client["email"], "password": "Str0ngPass!"})
    _add(c, c.cookies.get("mt_csrf"), "2026-10-02", "77.00")
    before = c.get("/api/history?months=1").json()["rows"][-1]["expenses"]

    c.post("/api/auth/login", json={"email": other_client["email"], "password": "Str0ngPass!"})
    other_rows = c.get("/api/history?months=1").json()["rows"]
    assert other_rows[-1]["expenses"] == "0.00"
    assert before == "77.00"


def test_dashboard_includes_previous_month(user_client):
    c = user_client["client"]
    token = user_client["csrf"]
    _add(c, token, "2026-09-05", "300.00")
    _add(c, token, "2026-10-05", "150.00")
    body = c.get("/api/dashboard?month=2026-10").json()
    assert body["previous"]["month"] == "2026-09"
    assert body["previous"]["expenses"] == "300.00"
    assert body["previous"]["expenses_change"]["delta"] == "-150.00"


def test_brief_returns_grounded_summary_without_provider(user_client):
    c = user_client["client"]
    token = user_client["csrf"]
    food = _cat(c, "Food")
    c.post("/api/budgets", headers={"X-CSRF-Token": token},
           json={"category_id": food, "month": "2026-10", "limit": "400.00"})
    _add(c, token, "2026-10-09", "600.00")

    res = c.post("/api/ai/brief", headers={"X-CSRF-Token": token},
                 json={"month": "2026-10", "locale": "en"})
    assert res.status_code == 200, res.text
    body = res.json()
    assert "600.00" in body["summary"]
    assert body["findings"]
    assert body["action"]
    assert body["ai"]["status"] in ("not_configured", "ok", "fallback")
