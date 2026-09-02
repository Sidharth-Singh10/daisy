import os
import sqlite3
from datetime import date, timedelta
from pathlib import Path

DB_PATH = os.environ.get("DAISY_DB_PATH", str(Path(__file__).parent / "daisy.db"))

SEED_DAILY = ["headlamp", "servo", "NEETCODE150", "system-design", "rjagro", "zerodha", "anvil", "gym"]

SEED_GROUPS = ["chest", "shoulders", "back", "biceps", "triceps", "legs", "core"]

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

            CREATE TABLE IF NOT EXISTS muscle_group (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                position INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS workout (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL UNIQUE,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS workout_group (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                workout_id INTEGER NOT NULL REFERENCES workout(id) ON DELETE CASCADE,
                group_id INTEGER NOT NULL REFERENCES muscle_group(id) ON DELETE CASCADE,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                UNIQUE(workout_id, group_id)
            );
            """
        )
        count = c.execute("SELECT COUNT(*) FROM task").fetchone()[0]
        if count == 0:
            c.executemany(
                "INSERT INTO task (name, cadence, position) VALUES (?, 'daily', ?)",
                ((name, i) for i, name in enumerate(SEED_DAILY)),
            )
        gcount = c.execute("SELECT COUNT(*) FROM muscle_group").fetchone()[0]
        if gcount == 0:
            c.executemany(
                "INSERT INTO muscle_group (name, position) VALUES (?, ?)",
                ((name, i) for i, name in enumerate(SEED_GROUPS)),
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


def fetch_groups() -> list[dict]:
    with connect() as c:
        return [dict(r) for r in c.execute("SELECT * FROM muscle_group ORDER BY position, id")]


def get_group(group_id: int) -> dict | None:
    with connect() as c:
        r = c.execute("SELECT * FROM muscle_group WHERE id = ?", (group_id,)).fetchone()
        return dict(r) if r else None


def create_group(name: str) -> dict:
    with connect() as c:
        pos = c.execute("SELECT COALESCE(MAX(position), -1) + 1 FROM muscle_group").fetchone()[0]
        cur = c.execute(
            "INSERT INTO muscle_group (name, position) VALUES (?, ?)", (name, pos)
        )
        return dict(c.execute("SELECT * FROM muscle_group WHERE id = ?", (cur.lastrowid,)).fetchone())


def update_group(group_id: int, fields: dict) -> dict | None:
    allowed = {k: v for k, v in fields.items() if k in ("name", "position")}
    if not allowed:
        return get_group(group_id)
    with connect() as c:
        sets = ", ".join(f"{k} = ?" for k in allowed)
        c.execute(f"UPDATE muscle_group SET {sets} WHERE id = ?", (*allowed.values(), group_id))
        r = c.execute("SELECT * FROM muscle_group WHERE id = ?", (group_id,)).fetchone()
        return dict(r) if r else None


def delete_group(group_id: int) -> bool:
    with connect() as c:
        cur = c.execute("DELETE FROM muscle_group WHERE id = ?", (group_id,))
        return cur.rowcount > 0


def fetch_workout_days(days: list[date]) -> dict[int, set[int]]:
    if not days:
        return {}
    placeholders = ",".join("?" * len(days))
    with connect() as c:
        rows = c.execute(
            f"""
            SELECT w.date, wg.group_id
            FROM workout w
            JOIN workout_group wg ON wg.workout_id = w.id
            WHERE w.date IN ({placeholders})
            """,
            tuple(d.isoformat() for d in days),
        ).fetchall()
    out: dict[str, set[int]] = {}
    for r in rows:
        out.setdefault(r["date"], set()).add(r["group_id"])
    return out


def set_workout_group(group_id: int, date_str: str, state: str | None = None) -> bool:
    with connect() as c:
        workout = c.execute("SELECT id FROM workout WHERE date = ?", (date_str,)).fetchone()
        if workout is None:
            cur = c.execute("INSERT INTO workout (date) VALUES (?)", (date_str,))
            workout_id = cur.lastrowid
        else:
            workout_id = workout["id"]
        exists = c.execute(
            "SELECT 1 FROM workout_group WHERE workout_id = ? AND group_id = ?",
            (workout_id, group_id),
        ).fetchone()
        if exists:
            if state == "done":
                return True
            c.execute(
                "DELETE FROM workout_group WHERE workout_id = ? AND group_id = ?",
                (workout_id, group_id),
            )
            remaining = c.execute(
                "SELECT COUNT(*) FROM workout_group WHERE workout_id = ?", (workout_id,)
            ).fetchone()[0]
            if remaining == 0:
                c.execute("DELETE FROM workout WHERE id = ?", (workout_id,))
            return False
        if state == "undone":
            return False
        c.execute(
            "INSERT INTO workout_group (workout_id, group_id) VALUES (?, ?)",
            (workout_id, group_id),
        )
        return True


def exercise_stats() -> dict:
    with connect() as c:
        rows = c.execute(
            """
            SELECT wg.group_id, g.name, COUNT(*) AS count
            FROM workout_group wg
            JOIN muscle_group g ON g.id = wg.group_id
            JOIN workout w ON w.id = wg.workout_id
            GROUP BY wg.group_id
            ORDER BY count DESC, g.name
            """
        ).fetchall()
        week_start = weekly_key(date.today())
        week_rows = c.execute(
            """
            SELECT wg.group_id, g.name, COUNT(*) AS count
            FROM workout_group wg
            JOIN muscle_group g ON g.id = wg.group_id
            JOIN workout w ON w.id = wg.workout_id
            WHERE w.date >= ?
            GROUP BY wg.group_id
            ORDER BY count DESC, g.name
            """,
            (week_start,),
        ).fetchall()
    return {
        "total": [dict(r) for r in rows],
        "week": [dict(r) for r in week_rows],
    }