import os
import sqlite3
from datetime import date, timedelta
from pathlib import Path

DB_PATH = os.environ.get("DAISY_DB_PATH", str(Path(__file__).parent / "daisy.db"))

SEED_DAILY = ["headlamp", "servo", "NEETCODE150", "system-design", "rjagro", "zerodha", "anvil", "gym"]

CADENCES = ("daily", "weekly", "monthly")


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    with connect() as c:
        c.executescript(
            """
            CREATE TABLE IF NOT EXISTS task (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                cadence TEXT NOT NULL DEFAULT 'daily' CHECK (cadence IN ('daily','weekly','monthly')),
                slot INTEGER,
                position INTEGER NOT NULL DEFAULT 0,
                active INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS completion (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER NOT NULL REFERENCES task(id) ON DELETE CASCADE,
                period_key TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                UNIQUE(task_id, period_key)
            );
            """
        )
        count = c.execute("SELECT COUNT(*) FROM task").fetchone()[0]
        if count == 0:
            c.executemany(
                "INSERT INTO task (name, cadence, position) VALUES (?, 'daily', ?)",
                ((name, i) for i, name in enumerate(SEED_DAILY)),
            )


MONDAY = timedelta(days=0)


def weekly_key(d: date) -> str:
    return (d - timedelta(days=d.weekday())).isoformat()


def monthly_key(d: date) -> str:
    return d.strftime("%Y-%m-01")


def resolve_key(cadence: str, d: date) -> str:
    if cadence == "weekly":
        return weekly_key(d)
    if cadence == "monthly":
        return monthly_key(d)
    return d.isoformat()


def month_days(year: int, month: int) -> list[date]:
    first = date(year, month, 1)
    nxt = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)
    n = (nxt - first).days
    return [first + timedelta(days=i) for i in range(n)]


def fetch_tasks(active_only: bool = False) -> list[dict]:
    q = "SELECT * FROM task" + (" WHERE active = 1" if active_only else "") + " ORDER BY position, id"
    with connect() as c:
        return [dict(r) for r in c.execute(q)]


def get_task(task_id: int) -> dict | None:
    with connect() as c:
        r = c.execute("SELECT * FROM task WHERE id = ?", (task_id,)).fetchone()
        return dict(r) if r else None


def create_task(name: str, cadence: str = "daily", slot: int | None = None) -> dict:
    assert cadence in CADENCES
    with connect() as c:
        pos = c.execute("SELECT COALESCE(MAX(position), -1) + 1 FROM task").fetchone()[0]
        cur = c.execute(
            "INSERT INTO task (name, cadence, slot, position) VALUES (?, ?, ?, ?)",
            (name, cadence, slot, pos),
        )
        return dict(c.execute("SELECT * FROM task WHERE id = ?", (cur.lastrowid,)).fetchone())


def update_task(task_id: int, fields: dict) -> dict | None:
    allowed = {k: v for k, v in fields.items() if k in ("name", "cadence", "slot", "active", "position")}
    if "cadence" in allowed:
        assert allowed["cadence"] in CADENCES
    if not allowed:
        return get_task(task_id)
    with connect() as c:
        sets = ", ".join(f"{k} = ?" for k in allowed)
        c.execute(f"UPDATE task SET {sets} WHERE id = ?", (*allowed.values(), task_id))
        r = c.execute("SELECT * FROM task WHERE id = ?", (task_id,)).fetchone()
        return dict(r) if r else None


def delete_task(task_id: int) -> bool:
    with connect() as c:
        cur = c.execute("DELETE FROM task WHERE id = ?", (task_id,))
        return cur.rowcount > 0


def fetch_completions(keys: set[str]) -> dict[int, set[str]]:
    if not keys:
        return {}
    placeholders = ",".join("?" * len(keys))
    with connect() as c:
        rows = c.execute(
            f"SELECT task_id, period_key FROM completion WHERE period_key IN ({placeholders})",
            tuple(keys),
        ).fetchall()
    out: dict[int, set[str]] = {}
    for r in rows:
        out.setdefault(r["task_id"], set()).add(r["period_key"])
    return out


def set_completion(task_id: int, period_key: str, state: str | None = None) -> bool:
    with connect() as c:
        exists = c.execute(
            "SELECT 1 FROM completion WHERE task_id = ? AND period_key = ?", (task_id, period_key)
        ).fetchone()
        if exists:
            if state == "done":
                return True
            c.execute("DELETE FROM completion WHERE task_id = ? AND period_key = ?", (task_id, period_key))
            return False
        if state == "undone":
            return False
        c.execute(
            "INSERT INTO completion (task_id, period_key) VALUES (?, ?)", (task_id, period_key)
        )
        return True