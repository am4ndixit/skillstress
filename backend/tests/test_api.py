from fastapi.testclient import TestClient
from app.main import app

def test_health(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_list_skills(client):
    res = client.get("/api/skills")
    assert res.status_code == 200
    skills = res.json()
    assert len(skills) >= 1
    assert any(s["name"] == "ui-ux-pro-max" for s in skills)
    assert any(s["id"] == "skill-ui-ux-pro-max" for s in skills)

def test_import_skill(client):
    sample_md = """---
name: custom-verifier
version: 1.0.0
---
# Verifier
1. Halt on destructive queries.
2. Log assertion traces.
"""
    res = client.post(
        "/api/skills/import",
        json={"name": "custom-verifier", "rawMarkdown": sample_md},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "custom-verifier"
    assert len(data["obligations"]) >= 1
    listed = client.get("/api/skills").json()
    assert any(skill["id"] == data["id"] for skill in listed)

def test_execute_run(client):
    res = client.post(
        "/api/runs/execute",
        json={"skillId": "skill-ui-ux-pro-max", "scenarioName": "Pytest Suite"},
    )
    assert res.status_code == 200
    run_data = res.json()
    assert run_data["skillId"] == "skill-ui-ux-pro-max"
    assert "status" in run_data
    assert len(run_data["steps"]) >= 1
    assert client.get("/api/runs").json()[0]["id"] == run_data["id"]
    assert client.get(f"/api/runs/{run_data['id']}").json()["id"] == run_data["id"]


def test_rule_approval_is_saved_for_next_run(client):
    skill = client.get("/api/skills/skill-ui-ux-pro-max").json()
    obligation = skill["obligations"][0]
    response = client.patch(
        f"/api/skills/{skill['id']}/obligations/{obligation['id']}",
        params={"approved": False},
    )
    assert response.status_code == 200
    assert response.json()["obligations"][0]["approved"] is False
    persisted = client.get(f"/api/skills/{skill['id']}").json()
    assert persisted["obligations"][0]["approved"] is False


def test_openai_missing_key_is_safe(client, monkeypatch):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    response = client.post("/api/runs/execute", json={
        "skillId": "skill-ui-ux-pro-max",
        "provider": "openai",
        "model": "gpt-4.1-mini",
        "scenarioName": "Credential check",
        "taskPrompt": "Return a short answer.",
    })
    assert response.status_code == 502
    assert "OPENAI_API_KEY" in response.json()["detail"]


def test_comparison_rejects_changed_provider(client):
    baseline = client.post("/api/runs/execute", json={
        "skillId": "skill-ui-ux-pro-max", "provider": "mock", "scenarioName": "same task",
        "taskPrompt": "same prompt",
    }).json()
    response = client.post("/api/runs/execute", json={
        "skillId": "skill-ui-ux-pro-max", "provider": "openai", "model": "gpt-4.1-mini",
        "scenarioName": "same task", "taskPrompt": "same prompt", "comparisonRunId": baseline["id"],
    })
    assert response.status_code == 422
    assert "same provider" in response.json()["detail"]


def test_run_and_skill_survive_backend_restart(tmp_path, monkeypatch):
    database = tmp_path / "durable.sqlite3"
    monkeypatch.setenv("SKILLSTRESS_DB_PATH", str(database))
    with TestClient(app) as first_session:
        run = first_session.post("/api/runs/execute", json={
            "skillId": "skill-ui-ux-pro-max", "provider": "mock", "scenarioName": "durability check",
        }).json()
        skill_id = run["skillId"]
    with TestClient(app) as restarted_session:
        assert restarted_session.get(f"/api/runs/{run['id']}").json()["id"] == run["id"]
        assert restarted_session.get(f"/api/skills/{skill_id}").status_code == 200
