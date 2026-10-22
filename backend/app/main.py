"""MoneyTwin AI API entrypoint."""
from __future__ import annotations

import logging
import secrets
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select

from .config import DATA_DIR, settings
from .db import SessionLocal, init_db
from .routers import admin, ai_routes, auth, budgets, dashboard, goals, meta, simulations, transactions
from .schemas import money
from .security import hash_password
from .services import seed

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("moneytwin")


def _ensure_admin() -> None:
    """Create one platform administrator. Credentials stay in a local file, never in the UI."""
    from .models import User

    db = SessionLocal()
    try:
        if db.scalar(select(User).where(User.role == "admin")):
            return
        password = secrets.token_urlsafe(12)
        admin_user = User(email="admin@moneytwin.my", password_hash=hash_password(password),
                          display_name="Platform Admin", role="admin", locale="en")
        db.add(admin_user)
        db.commit()
        cred_file = DATA_DIR / "admin-credentials.txt"
        cred_file.write_text(
            "MoneyTwin AI local admin (created automatically, local development only)\n"
            f"email: admin@moneytwin.my\npassword: {password}\n"
            "Delete this file after saving the password somewhere safe.\n",
            encoding="utf-8",
        )
        log.info("Admin account created; credentials written to %s", cred_file)
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    _ensure_admin()
    log.info("MoneyTwin API ready (database=%s, ai=%s)",
             "sqlite" if settings.is_sqlite else "postgres", settings.ai_provider)
    yield


app = FastAPI(title="MoneyTwin AI API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "X-CSRF-Token"],
    max_age=600,
)


@app.middleware("http")
async def harden(request: Request, call_next):
    request_id = uuid.uuid4().hex[:12]
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Cache-Control"] = "no-store"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    return response


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(status_code=400, content={"detail": str(exc)})


for router in (meta.router, auth.router, transactions.router, budgets.router, goals.router,
               simulations.router, dashboard.router, ai_routes.router, admin.router):
    app.include_router(router)


@app.get("/")
def root():
    return {"service": "MoneyTwin AI", "docs": "/docs", "health": "/health"}
