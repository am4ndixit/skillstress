"""Small SQLite repository for durable skills and evaluation runs."""

import json
import os
import sqlite3
from pathlib import Path
from typing import Iterable

from ..models.schemas import Skill, TestRun


def database_path() -> Path:
    configured = os.getenv("SKILLSTRESS_DB_PATH")
    path = Path(configured).expanduser() if configured else Path(__file__).parents[2] / "data" / "skillstress.sqlite3"
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def connect() -> sqlite3.Connection:
    connection = sqlite3.connect(database_path(), timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA journal_mode=WAL")
    connection.execute("PRAGMA foreign_keys=ON")
    return connection


def initialize_storage() -> None:
    with connect() as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS skills (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                is_builtin INTEGER NOT NULL DEFAULT 0,
                payload TEXT NOT NULL,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)
        db.execute("""
            CREATE TABLE IF NOT EXISTS runs (
                id TEXT PRIMARY KEY,
                skill_id TEXT NOT NULL,
                started_at TEXT NOT NULL,
                payload TEXT NOT NULL
            )
        """)
        db.execute("CREATE INDEX IF NOT EXISTS idx_runs_started_at ON runs(started_at DESC)")


def save_skill(skill: Skill) -> Skill:
    initialize_storage()
    payload = skill.model_dump_json()
    with connect() as db:
        db.execute(
            "INSERT INTO skills(id, name, is_builtin, payload, updated_at) VALUES(?, ?, ?, ?, CURRENT_TIMESTAMP) "
            "ON CONFLICT(id) DO UPDATE SET name=excluded.name, is_builtin=excluded.is_builtin, "
            "payload=excluded.payload, updated_at=CURRENT_TIMESTAMP",
            (skill.id, skill.name, int(skill.isBuiltin), payload),
        )
    return skill


def seed_skills(skills: Iterable[Skill]) -> None:
    initialize_storage()
    with connect() as db:
        for skill in skills:
            db.execute(
                "INSERT OR IGNORE INTO skills(id, name, is_builtin, payload) VALUES(?, ?, ?, ?)",
                (skill.id, skill.name, int(skill.isBuiltin), skill.model_dump_json()),
            )


def list_skills() -> list[Skill]:
    initialize_storage()
    with connect() as db:
        rows = db.execute("SELECT payload FROM skills ORDER BY is_builtin DESC, name COLLATE NOCASE").fetchall()
    return [Skill.model_validate_json(row["payload"]) for row in rows]


def get_skill(skill_id: str) -> Skill | None:
    initialize_storage()
    with connect() as db:
        row = db.execute("SELECT payload FROM skills WHERE id = ?", (skill_id,)).fetchone()
    return Skill.model_validate_json(row["payload"]) if row else None


def delete_skill(skill_id: str) -> bool:
    initialize_storage()
    with connect() as db:
        cursor = db.execute("DELETE FROM skills WHERE id = ? AND is_builtin = 0", (skill_id,))
        return cursor.rowcount > 0


def save_run(run: TestRun) -> TestRun:
    initialize_storage()
    with connect() as db:
        db.execute(
            "INSERT INTO runs(id, skill_id, started_at, payload) VALUES(?, ?, ?, ?) "
            "ON CONFLICT(id) DO UPDATE SET payload=excluded.payload",
            (run.id, run.skillId, run.startedAt, run.model_dump_json()),
        )
    return run


def list_runs(limit: int = 500) -> list[TestRun]:
    initialize_storage()
    with connect() as db:
        rows = db.execute("SELECT payload FROM runs ORDER BY started_at DESC LIMIT ?", (limit,)).fetchall()
    return [TestRun.model_validate_json(row["payload"]) for row in rows]


def get_run(run_id: str) -> TestRun | None:
    initialize_storage()
    with connect() as db:
        row = db.execute("SELECT payload FROM runs WHERE id = ?", (run_id,)).fetchone()
    return TestRun.model_validate_json(row["payload"]) if row else None
