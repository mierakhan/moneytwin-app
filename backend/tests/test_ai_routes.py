"""AI-02 and analysis shape: with no provider configured the analysis must still be computed."""
from __future__ import annotations


def _cat(client, name: str) -> str:
    cats = client.get("/api/auth/categories").json()["categories"]
    return next(c["id"] for c in cats if c["name"] == name and c["type"] == "expense")


def test_analyze_returns_computed_payload_without_provider(user_client):
    c = user_client["client"]
    token = user_client["csrf"]
    food = _cat(c, "Food")
    c.post("/api/budgets", headers={"X-CSRF-Token": token},
           json={"category_id": food, "month": "2026-10", "limit": "400.00"})
    c.post("/api/transactions", headers={"X-CSRF-Token": token}, json={
        "type": "expense", "amount": "600.00", "category_id": food,
        "transaction_date": "2026-10-09", "description": "Overspend",
    })

    r = c.post("/api/ai/analyze", headers={"X-CSRF-Token": token},
               json={"month": "2026-10", "locale": "en"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["computed"]["overspending_amount"] == "200.00"
    assert body["computed"]["highest_spending_category"] == "Food"
    assert body["ai"]["status"] in ("not_configured", "ok", "fallback", "error")
    assert body["insight"]
    assert body["grounded"] is True


def test_analyze_rejects_bad_month(user_client):
    r = user_client["client"].post("/api/ai/analyze", headers={"X-CSRF-Token": user_client["csrf"]},
                                   json={"month": "2026-13"})
    assert r.status_code == 422
