from __future__ import annotations

import time
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session as OrmSession

from ..db import get_db
from ..deps import get_current_user, require_csrf
from ..models import AIUsage, Conversation, Message, User
from ..schemas import AnalyzeIn, ChatIn, parse_month
from ..services import ai, finance

router = APIRouter(prefix="/api/ai", tags=["ai"])

WELCOME = {
    "en": "Hi! I'm MoneyTwin AI. I can help you understand your spending, budget better, and test what-if scenarios. What would you like to check?",
    "bm": "Hai! Saya MoneyTwin AI. Saya boleh bantu semak perbelanjaan, bajet dan simulasi kewangan. Nak mula dengan apa?",
}
SUGGESTIONS = {
    "en": ["Where did my money go?", "Am I overspending?", "How much should I save monthly?", "Can I afford RM300 extra each month?"],
    "bm": ["Ke mana wang saya pergi?", "Adakah saya terlebih belanja?", "Berapa patut saya simpan sebulan?", "Mampu ke tambah RM300 sebulan?"],
}


def _conversation(db: OrmSession, user: User, conversation_id: str | None) -> Conversation:
    if conversation_id:
        conv = db.scalar(select(Conversation).where(
            Conversation.id == conversation_id, Conversation.user_id == user.id))
        if not conv:
            raise HTTPException(404, detail="Conversation not found")
        return conv
    conv = Conversation(user_id=user.id, title="New chat")
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


def _history(db: OrmSession, conversation_id: str, limit: int = 10) -> list[dict[str, str]]:
    rows = db.scalars(select(Message).where(Message.conversation_id == conversation_id)
                      .order_by(Message.created_at.desc()).limit(limit)).all()
    ordered = list(reversed(rows))
    return [{"role": m.role, "content": m.content} for m in ordered if m.status != "error"]


@router.get("/status")
def status(user: User = Depends(get_current_user), db: OrmSession = Depends(get_db)):
    return {**ai.ai_status(db, user), "welcome": WELCOME, "suggestions": SUGGESTIONS}


@router.post("/chat")
def chat(payload: ChatIn, user: User = Depends(require_csrf), db: OrmSession = Depends(get_db)):
    locale = payload.locale or user.locale or "en"
    try:
        ai.check_limits(db, user)
    except ai.AIProviderError as exc:
        raise HTTPException(429, detail={"code": exc.code, "message": str(exc)}) from exc

    conv = _conversation(db, user, payload.conversation_id)
    month = finance.month_start()
    context = ai.build_context(db, user, month, locale=locale)

    user_msg = Message(conversation_id=conv.id, role="user", content=payload.message.strip(), status="ok")
    db.add(user_msg)
    if conv.title == "New chat":
        conv.title = payload.message.strip()[:60]
    db.commit()

    history = _history(db, conv.id)[:-1][-8:]
    system = ai.SYSTEM_PROMPT + "\n\nVERIFIED_DATA (computed by the backend, MYR):\n" + \
        __import__("json").dumps(context, ensure_ascii=False)
    started = time.perf_counter()

    cfg = ai.provider_config()
    if not cfg["configured"]:
        latency = int((time.perf_counter() - started) * 1000)
        ai.log_usage(db, user.id, "chat", cfg["provider"], "error", latency, "ai_not_configured")
        raise HTTPException(503, detail={
            "code": "ai_not_configured",
            "message": "AI is not connected yet. Set AI_PROVIDER and the matching keys in backend/.env, then restart the API.",
            "hint": ai.deterministic_brief(context, locale),
        })

    try:
        result = ai._ask_provider(system, history, payload.message.strip(), session_id=f"mt-{user.id}-{conv.id}")
        ok, bad = ai.validate_reply(result.text, context, payload.message)
        attempts = 1
        if not ok:
            # One retry with an explicit correction, then fall back to computed facts.
            correction = (f"Your previous answer mentioned amounts not present in VERIFIED_DATA: {', '.join(bad)}. "
                          "Rewrite using only RM amounts from VERIFIED_DATA, or say the figure is not available.")
            result = ai._ask_provider(system, history, payload.message.strip() + "\n\n" + correction,
                                      session_id=f"mt-{user.id}-{conv.id}")
            ok, bad = ai.validate_reply(result.text, context, payload.message)
            attempts = 2
        latency = int((time.perf_counter() - started) * 1000)
        if ok:
            reply, msg_status = result.text.strip(), "ok"
            ai.log_usage(db, user.id, "chat", cfg["provider"], "ok", latency,
                         tokens_input=result.tokens_input, tokens_output=result.tokens_output)
            source = "ai:verified-data"
        else:
            reply = ai.deterministic_brief(context, locale)
            msg_status = "fallback"
            ai.log_usage(db, user.id, "chat", cfg["provider"], "error", latency, "ungrounded_numbers",
                         tokens_input=result.tokens_input, tokens_output=result.tokens_output)
            source = "backend-computed"
    except ai.AINotConfigured as exc:
        raise HTTPException(503, detail={"code": "ai_not_configured", "message": str(exc),
                                         "hint": ai.deterministic_brief(context, locale)}) from exc
    except ai.AIProviderError as exc:
        latency = int((time.perf_counter() - started) * 1000)
        ai.log_usage(db, user.id, "chat", cfg["provider"], "error", latency, exc.code)
        raise HTTPException(502, detail={"code": exc.code, "message": str(exc),
                                         "hint": "Your saved transactions and budgets are unaffected. "
                                                 "You can keep using the app without AI."}) from exc

    assistant = Message(conversation_id=conv.id, role="assistant", content=reply, status=msg_status)
    db.add(assistant)
    conv.updated_at = finance.kl_now()
    db.commit()
    db.refresh(assistant)
    return {
        "reply": reply,
        "conversation_id": conv.id,
        "message_id": assistant.id,
        "status": msg_status,
        "source": source,
        "data_period": context["period"],
        "provider": cfg["provider"],
        "model": cfg["model"],
        "attempts": attempts,
    }


@router.post("/analyze")
def analyze(payload: AnalyzeIn, user: User = Depends(require_csrf), db: OrmSession = Depends(get_db)):
    locale = payload.locale or user.locale or "en"
    try:
        month = parse_month(payload.month) or finance.month_start()
    except ValueError:
        raise HTTPException(400, detail="month must look like YYYY-MM")
    context = ai.build_context(db, user, month, locale=locale)
    summary = finance.month_summary(db, user.id, month)
    overspent = [b for b in context["budgets"] if b["state"] == "over"]
    highest = summary["categories"][0] if summary["categories"] else None
    over_total = sum(
        max(Decimal("0"), Decimal(b["spent"]) - Decimal(b["limit"]))
        for b in context["budgets"]
    )
    computed = {
        "period": context["period"],
        "period_label": context["period_label"],
        "income": context["income"],
        "expenses": context["expenses"],
        "balance": context["balance"],
        "highest_spending_category": highest["name"] if highest else None,
        "highest_category_amount": highest["amount"] if highest else None,
        "overspending_amount": finance.money(int(over_total * 100)),
        "overspent_categories": [b["category"] for b in overspent],
        "categories": context["categories"],
        "budgets": context["budgets"],
        "goals": context["goals"],
        "has_data": context["has_data"],
    }
    cfg = ai.provider_config()
    if not cfg["configured"]:
        return {
            "computed": computed,
            "insight": ai.deterministic_brief(context, locale),
            "recommendation": None,
            "ai": {"status": "not_configured", "provider": cfg["provider"], "model": None},
            "needs_review": not context["has_data"],
            "grounded": True,
            "notice": "AI is not connected. Figures below are computed by the backend from your recorded data.",
        }
    try:
        ai.check_limits(db, user)
    except ai.AIProviderError as exc:
        raise HTTPException(429, detail={"code": exc.code, "message": str(exc)}) from exc

    question = (
        f"Analyse my {context['period_label']} finances in {'Bahasa Melayu' if locale == 'bm' else 'English'}. "
        "Explain the biggest patterns in 3 short sentences, then give 2 practical, non-guaranteed suggestions. "
        "Use only VERIFIED_DATA amounts."
    )
    system = ai.SYSTEM_PROMPT + "\n\nVERIFIED_DATA:\n" + __import__("json").dumps(context, ensure_ascii=False)
    started = time.perf_counter()
    try:
        result = ai._ask_provider(system, [], question, session_id=f"mt-analyze-{user.id}")
        ok, bad = ai.validate_reply(result.text, context)
        if not ok:
            correction = (f"Your previous answer quoted amounts that are not in VERIFIED_DATA: {', '.join(bad)}. "
                          "Rewrite the analysis using only the RM amounts from VERIFIED_DATA.")
            result = ai._ask_provider(system, [], question + "\n\n" + correction,
                                      session_id=f"mt-analyze-{user.id}")
            ok, bad = ai.validate_reply(result.text, context)
        latency = int((time.perf_counter() - started) * 1000)
        if ok:
            text = result.text.strip()
            status_ = "ok"
            ai.log_usage(db, user.id, "analyze", cfg["provider"], "ok", latency,
                         tokens_input=result.tokens_input, tokens_output=result.tokens_output)
        else:
            text = ai.deterministic_brief(context, locale)
            status_ = "fallback"
            ai.log_usage(db, user.id, "analyze", cfg["provider"], "error", latency,
                         error_code=("ungrounded:" + ",".join(bad))[:40])
    except ai.AIProviderError as exc:
        latency = int((time.perf_counter() - started) * 1000)
        ai.log_usage(db, user.id, "analyze", cfg["provider"], "error", latency, exc.code)
        return {
            "computed": computed,
            "insight": ai.deterministic_brief(context, locale),
            "recommendation": None,
            "ai": {"status": "error", "error_code": exc.code, "provider": cfg["provider"], "model": cfg["model"]},
            "needs_review": True,
            "grounded": True,
            "notice": "The AI service did not respond. These figures are still computed from your data.",
        }
    parts = [p.strip() for p in text.split("\n") if p.strip()]
    return {
        "computed": computed,
        "insight": text,
        "recommendation": parts[-1] if len(parts) > 1 else None,
        "ai": {"status": status_, "provider": cfg["provider"], "model": cfg["model"]},
        "needs_review": status_ != "ok",
        "grounded": status_ == "ok",
    }


@router.get("/conversations")
def list_conversations(user: User = Depends(get_current_user), db: OrmSession = Depends(get_db)):
    rows = db.scalars(select(Conversation).where(Conversation.user_id == user.id)
                      .order_by(Conversation.updated_at.desc()).limit(50))
    return {"conversations": [
        {"id": c.id, "title": c.title, "updated_at": c.updated_at.isoformat()} for c in rows
    ]}


@router.get("/conversations/{conversation_id}/messages")
def get_messages(conversation_id: str, user: User = Depends(get_current_user),
                 db: OrmSession = Depends(get_db)):
    conv = db.scalar(select(Conversation).where(Conversation.id == conversation_id,
                                                Conversation.user_id == user.id))
    if not conv:
        raise HTTPException(404, detail="Conversation not found")
    rows = db.scalars(select(Message).where(Message.conversation_id == conv.id)
                      .order_by(Message.created_at)).all()
    return {"conversation_id": conv.id, "title": conv.title, "messages": [
        {"id": m.id, "role": m.role, "content": m.content, "status": m.status,
         "created_at": m.created_at.isoformat()} for m in rows
    ]}


@router.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: str, user: User = Depends(require_csrf),
                        db: OrmSession = Depends(get_db)):
    conv = db.scalar(select(Conversation).where(Conversation.id == conversation_id,
                                                Conversation.user_id == user.id))
    if not conv:
        raise HTTPException(404, detail="Conversation not found")
    for m in db.scalars(select(Message).where(Message.conversation_id == conv.id)):
        db.delete(m)
    db.delete(conv)
    db.commit()
    return {"ok": True}


@router.get("/usage")
def usage(days: int = Query(default=30, ge=1, le=365), user: User = Depends(get_current_user),
          db: OrmSession = Depends(get_db)):
    since = finance.kl_now() - finance.timedelta(days=days)
    rows = db.execute(
        select(AIUsage.feature, AIUsage.status, func.count(AIUsage.id), func.avg(AIUsage.latency_ms))
        .where(AIUsage.user_id == user.id, AIUsage.created_at >= since)
        .group_by(AIUsage.feature, AIUsage.status)
    ).all()
    return {"days": days, "buckets": [
        {"feature": f, "status": s, "count": int(c), "avg_latency_ms": int(avg or 0)} for f, s, c, avg in rows
    ]}
