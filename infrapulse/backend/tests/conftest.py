import os
from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

os.environ["APP_ENV"] = "test"
os.environ["DEMO_MODE"] = "true"
os.environ["AI_PROVIDER"] = "demo"
os.environ["SCHEDULER_ENABLED"] = "false"
os.environ["TIMEZONE"] = "UTC"
os.environ["SCHEDULE_TIME"] = "09:00"


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Generator[TestClient, None, None]:
    db_path = tmp_path / "infrapulse-test.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path.as_posix()}")
    monkeypatch.setenv("DEMO_MODE", "true")
    monkeypatch.setenv("SCHEDULER_ENABLED", "false")

    from app.core.config import reload_settings
    from app.db.session import reset_engine

    reload_settings()
    reset_engine()

    from app.main import create_app

    application = create_app()
    with TestClient(application) as test_client:
        yield test_client

    reset_engine()
    reload_settings()
