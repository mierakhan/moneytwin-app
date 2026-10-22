"""Application configuration. Secrets come from the environment only."""
from __future__ import annotations

import secrets
from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(BASE_DIR.parent / ".env"), extra="ignore")

    app_name: str = "MoneyTwin AI"
    app_secret_key: str = ""  # generated below when absent (dev only)
    database_url: str = f"sqlite:///{(DATA_DIR / 'moneytwin.db').as_posix()}"
    frontend_origin: str = "http://localhost:5173"
    api_host: str = "127.0.0.1"
    api_port: int = 8000

    session_cookie: str = "mt_session"
    csrf_cookie: str = "mt_csrf"
    session_days: int = 14
    cookie_secure: bool = False

    ai_provider: str = "off"          # off | flowise | openai
    flowise_url: str = "http://localhost:3000"
    flowise_flow_id: str = ""
    flowise_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    ai_request_timeout_seconds: int = 45
    ai_daily_limit: int = 100
    ai_monthly_budget_rm: int = 20

    login_rate_limit_per_minute: int = 10
    ai_rate_limit_per_minute: int = 10

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")

    @property
    def allowed_origins(self) -> List[str]:
        return [o.strip() for o in self.frontend_origin.split(",") if o.strip()]

    @property
    def resolved_secret(self) -> str:
        # Dev fallback keeps the app bootable; production must set APP_SECRET_KEY.
        return self.app_secret_key or _DEV_SECRET


# Stable per-install dev secret so sessions survive a restart during local demo.
_secret_file = DATA_DIR / ".dev_secret"
if _secret_file.exists():
    _DEV_SECRET = _secret_file.read_text(encoding="utf-8").strip()
else:
    _DEV_SECRET = secrets.token_urlsafe(48)
    _secret_file.write_text(_DEV_SECRET, encoding="utf-8")

settings = Settings()
