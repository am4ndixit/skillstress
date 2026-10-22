import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("SKILLSTRESS_DB_PATH", str(tmp_path / "skillstress-test.sqlite3"))
    with TestClient(app) as test_client:
        yield test_client
