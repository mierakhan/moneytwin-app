from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session as OrmSession

from ..config import settings
from ..db import get_db
from ..deps import get_current_session, get_current_user, require_csrf
from ..models import Session, User
from ..schemas import LoginIn, ProfileIn, RegisterIn, to_minor
from ..security import (
    limiter, hash_password, new_token, session_expiry, token_hash, verify_password,
)
from ..services import seed
from ..services.finance import money

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _client_key(request: Request, email: str = "") -> str:
    ip = request.client.host if request.client else "unknown"
    return f"login:{ip}:{email.lower()}"


def _start_session(db: OrmSession, response: Response, user: User, request: Request) -> Session:
    raw = new_token()
    csrf = new_token(24)
    session = Session(user_id=user.id, token_hash=token_hash(raw), csrf_token=csrf,
                      expires_at=session_expiry(settings.session_days))
    db.add(session)
    db.commit()
    response.set_cookie(settings.session_cookie, raw, httponly=True, samesite="lax",
                        secure=settings.cookie_secure, max_age=settings.session_days * 86400, path="/")
    # Readable by JS on purpose: used for the double-submit CSRF header only.
    response.set_cookie(settings.csrf_cookie, csrf, httponly=False, samesite="lax",
                        secure=settings.cookie_secure, max_age=settings.session_days * 86400, path="/")
    return session


def user_payload(user: User, session: Session | None = None) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "display_name": user.display_name,
        "role": user.role,
        "locale": user.locale,
        "status": user.status,
        "is_demo": user.is_demo,
        "monthly_income": money(user.monthly_income_minor) if user.monthly_income_minor is not None else None,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "csrf_token": session.csrf_token if session else None,
    }


@router.post("/register", status_code=201)
def register(payload: RegisterIn, request: Request, response: Response, db: OrmSession = Depends(get_db)):
    ok, retry = limiter.check(_client_key(request, payload.email), settings.login_rate_limit_per_minute)
    if not ok:
        raise HTTPException(429, detail=f"Too many attempts. Try again in {retry}s.", headers={"Retry-After": str(retry)})
    email = payload.email.lower().strip()
    if db.scalar(select(User).where(User.email == email)):
        # Same message as a generic failure: do not confirm account existence details.
        raise HTTPException(400, detail="That email cannot be used. Try signing in instead.")
    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        display_name=payload.display_name.strip(),
        locale=payload.locale,
        is_demo=False,
    )
    if payload.monthly_income:
        user.monthly_income_minor = to_minor(payload.monthly_income)
    db.add(user)
    db.flush()
    if payload.load_demo_data:
        seed.seed_user_data(db, user)
    else:
        seed.ensure_categories(db, user)
        db.commit()
    db.refresh(user)
    session = _start_session(db, response, user, request)
    return {"user": user_payload(user, session), "demo_loaded": payload.load_demo_data}


@router.post("/login")
def login(payload: LoginIn, request: Request, response: Response, db: OrmSession = Depends(get_db)):
    email = payload.email.lower().strip()
    ok, retry = limiter.check(_client_key(request, email), settings.login_rate_limit_per_minute)
    if not ok:
        raise HTTPException(429, detail=f"Too many attempts. Try again in {retry}s.", headers={"Retry-After": str(retry)})
    user = db.scalar(select(User).where(User.email == email))
    if not user or not verify_password(user.password_hash, payload.password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Email or password is incorrect")
    if user.status != "active":
        raise HTTPException(403, detail="This account is not active. Contact the administrator.")
    limiter.reset(_client_key(request, email))
    session = _start_session(db, response, user, request)
    return {"user": user_payload(user, session)}


@router.post("/demo")
def demo_login(request: Request, response: Response, db: OrmSession = Depends(get_db)):
    """Sign in to the shared fictional demo account, creating it on first use."""
    ok, retry = limiter.check(_client_key(request, "demo"), settings.login_rate_limit_per_minute)
    if not ok:
        raise HTTPException(429, detail=f"Too many attempts. Try again in {retry}s.")
    user = db.scalar(select(User).where(User.email == seed.DEMO_EMAIL))
    if not user:
        user = User(email=seed.DEMO_EMAIL, password_hash=hash_password(seed.DEMO_PASSWORD),
                    display_name="Demo Student", locale="en", is_demo=True, role="owner")
        user.monthly_income_minor = to_minor("2500.00")
        db.add(user)
        db.commit()
        seed.seed_user_data(db, user)
        db.refresh(user)
    session = _start_session(db, response, user, request)
    return {"user": user_payload(user, session), "demo": True}


@router.post("/logout")
def logout(response: Response, pair=Depends(get_current_session), _: User = Depends(require_csrf),
           db: OrmSession = Depends(get_db)):
    user, session = pair
    db.delete(session)
    db.commit()
    response.delete_cookie(settings.session_cookie, path="/")
    response.delete_cookie(settings.csrf_cookie, path="/")
    return {"ok": True}


@router.get("/me")
def me(pair=Depends(get_current_session)):
    user, session = pair
    return {"user": user_payload(user, session)}


@router.patch("/profile")
def update_profile(payload: ProfileIn, user: User = Depends(require_csrf), db: OrmSession = Depends(get_db)):
    if payload.display_name:
        user.display_name = payload.display_name.strip()
    if payload.locale:
        user.locale = payload.locale
    if payload.monthly_income is not None:
        user.monthly_income_minor = to_minor(payload.monthly_income) if payload.monthly_income else None
    if payload.password:
        if not payload.current_password or not verify_password(user.password_hash, payload.current_password):
            raise HTTPException(400, detail="Current password is required to set a new one")
        user.password_hash = hash_password(payload.password)
    db.commit()
    db.refresh(user)
    return {"user": user_payload(user)}


@router.post("/reset-demo")
def reset_demo(user: User = Depends(require_csrf), db: OrmSession = Depends(get_db)):
    if not user.is_demo:
        raise HTTPException(403, detail="Sample data reset is available on the demo account only")
    seed.reset_demo_data(db, user)
    return {"ok": True, "reset": True}


@router.delete("/account")
def delete_account(user: User = Depends(require_csrf), db: OrmSession = Depends(get_db)):
    """Deletes only the signed-in user's own account and rows (cascade)."""
    db.delete(user)
    db.commit()
    return {"ok": True}


@router.get("/categories")
def categories(user: User = Depends(get_current_user), db: OrmSession = Depends(get_db)):
    from ..models import Category

    rows = db.scalars(select(Category).where(Category.user_id == user.id).order_by(Category.type, Category.name))
    return {"categories": [{"id": c.id, "name": c.name, "type": c.type, "icon": c.icon} for c in rows]}
