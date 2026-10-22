"""Contract checks for AI replies (docs/PROMPT_CONTRACT.md) and AC5.4 goal dates."""
from __future__ import annotations

import pytest

from app.services import ai


class FakeResult:
    def __init__(self, text: str) -> None:
        self.text = text
        self.tokens_input = 10
        self.tokens_output = 20


def test_extract_json_tolerates_fences_and_prose():
    assert ai.extract_json('{"answer": "hi", "topic": "x", "needs_review": false}')["answer"] == "hi"
    fenced = 'Here you go:\n```json\n{"answer": "ok", "topic": "t", "needs_review": true}\n```'
    assert ai.extract_json(fenced)["needs_review"] is True
    assert ai.extract_json("no json here") is None


def test_check_contract_catches_missing_and_wrong_types():
    ok, problems, _ = ai.check_contract({"answer": "x"}, ai.CHAT_CONTRACT)
    assert not ok and any("missing topic" in p for p in problems)

    ok, problems, _ = ai.check_contract(
        {"answer": "x", "topic": "t", "needs_review": "no"}, ai.CHAT_CONTRACT)
    assert not ok and any("bool" in p for p in problems)

    ok, problems, _ = ai.check_contract(
        {"answer": "x", "topic": "t", "needs_review": True}, ai.CHAT_CONTRACT)
    assert ok and problems == []


def test_numbers_match_allows_a_single_sen():
    assert ai.numbers_match(600.0, 60000)
    assert ai.numbers_match(600.001, 60000)
    assert not ai.numbers_match(601.0, 60000)


def _configure(monkeypatch, reply: str):
    monkeypatch.setattr(ai, "provider_config", lambda: {
        "provider": "flowise", "configured": True, "model": "test-model", "url": "http://stub"})
    monkeypatch.setattr(ai, "_ask_provider", lambda *a, **k: FakeResult(reply))


def test_chat_unpacks_contract_json(user_client, monkeypatch):
    _configure(monkeypatch, '{"answer": "Your balance is on the dashboard.", "topic": "balance", "needs_review": false}')
    body = user_client["client"].post(
        "/api/ai/chat",
        headers={"X-CSRF-Token": user_client["csrf"]},
        json={"message": "What is my balance?", "locale": "en"},
    ).json()
    assert body["contract"] == "json"
    assert body["needs_review"] is False
    assert "dashboard" in body["reply"]


def test_chat_flags_prose_replies_for_review(user_client, monkeypatch):
    _configure(monkeypatch, "Your balance is RM887.50 this month.")
    body = user_client["client"].post(
        "/api/ai/chat",
        headers={"X-CSRF-Token": user_client["csrf"]},
        json={"message": "What is my balance?", "locale": "en"},
    ).json()
    assert body["contract"] == "text"
    assert body["needs_review"] is True


def test_chat_rejects_json_with_invented_amount(user_client, monkeypatch):
    _configure(monkeypatch, '{"answer": "You have RM99,999.00.", "topic": "balance", "needs_review": false}')
    body = user_client["client"].post(
        "/api/ai/chat",
        headers={"X-CSRF-Token": user_client["csrf"]},
        json={"message": "What is my balance?", "locale": "en"},
    ).json()
    assert body["status"] == "fallback"
    assert "99,999" not in body["reply"]


def test_analyze_rejects_numbers_that_disagree_with_backend(user_client, monkeypatch):
    _configure(monkeypatch, (
        '{"summary": "Food is over budget.", "highest_spending_category": "Food", '
        '"total_expenses": 1600.00, "overspending_amount": 999.00, '
        '"recommendation": "Trim food.", "needs_review": false}'
    ))
    body = user_client["client"].post(
        "/api/ai/analyze",
        headers={"X-CSRF-Token": user_client["csrf"]},
        json={"month": "2026-10", "locale": "en"},
    ).json()
    assert body["ai"]["status"] == "fallback"
    assert body["needs_review"] is True


def test_goal_with_past_deadline_is_rejected(user_client):
    res = user_client["client"].post(
        "/api/goals",
        headers={"X-CSRF-Token": user_client["csrf"]},
        json={"title": "Old goal", "target_amount": "1000.00", "deadline": "2020-01-01"},
    )
    assert res.status_code == 400
    assert "future" in res.json()["detail"].lower()
