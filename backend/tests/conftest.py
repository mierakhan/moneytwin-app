import os
import sys
import tempfile
from pathlib import Path

import pytest

TMP = tempfile.mkdtemp(prefix="moneytwin-test-")
os.environ["DATABASE_URL"] = f"sqlite:///{(Path(TMP) / 'test.db').as_posix()}"
os.environ["APP_SECRET_KEY"] = "test-secret-key-not-for-production"
os.environ["AI_PROVIDER"] = "off"
os.environ["FRONTEND_ORIGIN"] = "http://localhost:5173"

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


def csrf(client: TestClient) -> dict[str, str]:
    return {"X-CSRF-Token": client.cookies.get("mt_csrf", "")}


@pytest.fixture
def user_client(client: TestClient):
    """Fresh registered owner with categories and no transactions."""
    import uuid

    email = f"user-{uuid.uuid4().hex[:10]}@example.com"
    resp = client.post("/api/auth/register", json={
        "email": email, "password": "Str0ngPass!", "display_name": "Test Owner", "locale": "en",
    })
    assert resp.status_code == 201, resp.text
    token = client.cookies.get("mt_csrf")
    return {"client": client, "email": email, "csrf": token, "user": resp.json()["user"]}


@pytest.fixture
def other_client(client: TestClient):
    import uuid

    email = f"other-{uuid.uuid4().hex[:10]}@example.com"
    resp = client.post("/api/auth/register", json={
        "email": email, "password": "Str0ngPass!", "display_name": "Other Owner", "locale": "en",
    })
    assert resp.status_code == 201, resp.text
    return {"client": client, "email": email, "csrf": client.cookies.get("mt_csrf"),
            "user": resp.json()["user"]}
