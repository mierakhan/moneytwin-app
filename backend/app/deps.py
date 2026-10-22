"""Request dependencies: session authentication and ownership helpers."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session as OrmSession

from .config import settings
from .db import get_db
from .models import Session, User
from .security import as_utc, token_hash


def _unauthorized(detail: str = "Not signed in") -> HTTPException:
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


def get_current_session(request: Request, db: OrmSession = Depends(get_db)) -> tuple[User, Session]:
    raw = request.cookies.get(settings.session_cookie)
    if not raw:
        raise _unauthorized()
    row = db.scalar(select(Session).where(Session.token_hash == token_hash(raw)))
    if not row:
        raise _unauthorized("Session expired")
    if as_utc(row.expires_at) < datetime.now(timezone.utc):
        db.delete(row)
        db.commit()
        raise _unauthorized("Session expired")
    user = db.get(User, row.user_id)
    if not user or user.status != "active":
        raise _unauthorized("Account is not active")
    return user, row


def get_current_user(pair: tuple[User, Session] = Depends(get_current_session)) -> User:
    return pair[0]


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Administrator access only")
    return user


def require_csrf(pair: tuple[User, Session] = Depends(get_current_session),
                 x_csrf_token: str | None = Header(default=None)) -> User:
    """Double-submit CSRF check for every state-changing request."""
    user, session = pair
    if not x_csrf_token or x_csrf_token != session.csrf_token:
        raise HTTPException(status_code=403, detail="Missing or invalid CSRF token")
    return user
