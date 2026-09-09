import os
import sys
from datetime import date as Date, timedelta
from typing import Any, Callable

import httpx
import uvicorn
from fastmcp import FastMCP

BASE = os.environ.get("DAISY_API_URL", "http://localhost:8000")
TOKEN = os.environ.get("MCP_TOKEN", "")
mcp = FastMCP("daisy-planner")


def api(path: str, method: str = "GET", **kw: Any) -> Any:
    r = httpx.request(method, f"{BASE}/api{path}", timeout=15, **kw)
    r.raise_for_status()
    return r.json() if r.content else None


def to_iso(value: str | None) -> str:
    v = (value or "today").strip().lower()
    if v == "today":
        return Date.today().isoformat()
    if v == "yesterday":
        return (Date.today() - timedelta(days=1)).isoformat()
    Date.fromisoformat(v)
    return v


@mcp.tool
def planner_list_tasks() -> str:
    """List all planner tasks (id, name, cadence, slot, active)."""
    return "\n".join(
        f"{t['id']}  {t['name']:<24} {t['cadence']:<8} slot={t['slot']} active={t['active']}"
        for t in api("/tasks")
    )


@mcp.tool
def planner_add_task(name: str, cadence: str = "daily", slot: int | None = None) -> str:
    """Add a task. cadence: daily|weekly|monthly. weekly slot = weekday 0-6 (Mon=0), monthly slot = day 1-31."""
    t = api("/tasks", "POST", json={"name": name, "cadence": cadence, "slot": slot})
    return f"added task {t['id']}: {t['name']} ({t['cadence']})" if isinstance(t, dict) else str(t)


@mcp.tool
def planner_remove_task(task_id: int) -> str:
    """Remove a task permanently (its completions are deleted too)."""
    api(f"/tasks/{task_id}", "DELETE")
    return f"removed task {task_id}"


@mcp.tool
def planner_update_task(
    task_id: int, name: str | None = None, cadence: str | None = None, slot: int | None = None
) -> str:
    """Rename a task or change its cadence/slot."""
    body = {k: v for k, v in {"name": name, "cadence": cadence, "slot": slot}.items() if v is not None}
    t = api(f"/tasks/{task_id}", "PATCH", json=body)
    return f"task {t['id']} now: {t['name']} ({t['cadence']}, slot={t['slot']})"


@mcp.tool
def planner_check(task_id: int, date: str = "today", state: str | None = None) -> str:
    """Mark a task done/undone for a date (YYYY-MM-DD | today | yesterday). state: done|undone, omit to toggle."""
    d = to_iso(date)
    r = api(f"/completions/{task_id}", "PUT", params={"date": d, **({"state": state} if state else {})})
    return f"task {r['task_id']} {'done' if r['done'] else 'undone'} for period {r['period_key']}"


@mcp.tool
def planner_status(date: str = "today") -> str:
    """Progress summary for a date (YYYY-MM-DD | today): X/N done, pending tasks, weekly & monthly status."""
    d = Date.fromisoformat(to_iso(date))
    cal = api(f"/calendar?month={d.strftime('%Y-%m')}")
    day = cal["days"][d.isoformat()]
    pending = [t["name"] for t in day["tasks"] if not t["done"]]
    weekly = [t["name"] for t in day["tasks"] if t["cadence"] == "weekly" and not t["done"]]
    monthly = [t["name"] for t in day["tasks"] if t["cadence"] == "monthly" and not t["done"]]
    lines = [
        f"{d.isoformat()} — {day['done']}/{day['total']} done",
        f"pending ({len(pending)}): {', '.join(pending) if pending else 'none'}",
    ]
    if weekly:
        lines.append(f"weekly due: {', '.join(weekly)}")
    if monthly:
        lines.append(f"monthly due: {', '.join(monthly)}")
    return "\n".join(lines)


@mcp.tool
def gym_list_groups() -> str:
    """List all muscle groups (id, name)."""
    return "\n".join(f"{g['id']}  {g['name']}" for g in api("/gym/groups"))


@mcp.tool
def gym_add_group(name: str) -> str:
    """Add a muscle group."""
    g = api("/gym/groups", "POST", json={"name": name})
    return f"added group {g['id']}: {g['name']}" if isinstance(g, dict) else str(g)


@mcp.tool
def gym_rename_group(group_id: int, name: str) -> str:
    """Rename a muscle group."""
    g = api(f"/gym/groups/{group_id}", "PATCH", json={"name": name})
    return f"group {g['id']} now: {g['name']}"


@mcp.tool
def gym_remove_group(group_id: int) -> str:
    """Remove a muscle group permanently (its workout history is deleted too)."""
    api(f"/gym/groups/{group_id}", "DELETE")
    return f"removed group {group_id}"


@mcp.tool
def gym_log(group_id: int, date: str = "today", state: str | None = None) -> str:
    """Mark a muscle group trained/untrained for a date (YYYY-MM-DD | today | yesterday). state: done|undone, omit to toggle."""
    d = to_iso(date)
    r = api(f"/gym/workouts/{group_id}", "PUT", params={"date": d, **({"state": state} if state else {})})
    return f"group {r['group_id']} {'done' if r['done'] else 'undone'} for {r['date']}"


@mcp.tool
def gym_stats() -> str:
    """Frequency of each muscle group, all-time and this week."""
    s = api("/gym/stats")
    lines = ["this week:"]
    lines += [f"  {c['name']:<12} {c['count']}×" for c in s["week"]] or ["  none"]
    lines.append("all time:")
    lines += [f"  {c['name']:<12} {c['count']}×" for c in s["total"]] or ["  none"]
    return "\n".join(lines)


def resolve_exercise(exercise: str | int) -> dict:
    """Find an exercise by id or (case-insensitive) name."""
    exercises = api("/gym/exercises")
    if isinstance(exercise, int) or (isinstance(exercise, str) and exercise.strip().isdigit()):
        eid = int(exercise)
        for e in exercises:
            if e["id"] == eid:
                return e
        raise ValueError(f"no exercise with id {eid}")
    q = str(exercise).strip().lower()
    for e in exercises:
        if e["name"].lower() == q:
            return e
    matches = [e for e in exercises if q in e["name"].lower()]
    if len(matches) == 1:
        return matches[0]
    if len(matches) > 1:
        raise ValueError(f"ambiguous exercise '{exercise}': " + ", ".join(e["name"] for e in matches))
    raise ValueError(f"no exercise matching '{exercise}' — use gym_list_exercises to see options")


@mcp.tool
def gym_list_exercises() -> str:
    """List all tracked exercises with latest set, PR weight and session count."""
    exercises = api("/gym/exercises")
    if not exercises:
        return "no exercises tracked"
    lines = []
    for e in exercises:
        entries = sorted(e["entries"], key=lambda x: x["date"])
        last = entries[-1] if entries else None
        pr = max((x["max_weight"] for x in entries), default=None)
        latest = f"last {last['date']}: {last['max_weight']:g}kg × {last['max_reps']}" if last else "never logged"
        pr_txt = f"pr {pr:g}kg" if pr is not None else "—"
        lines.append(f"{e['id']}  {e['name']:<22} {latest:<34} {pr_txt:<10} {len(entries)} sessions")
    return "\n".join(lines)


@mcp.tool
def gym_log_lift(exercise: str | int, weight: float, reps: int, date: str = "today") -> str:
    """Log a best set for an exercise (by id or name). date: YYYY-MM-DD | today | yesterday — past dates backfill. Overwrites the entry for that date if one exists."""
    e = resolve_exercise(exercise)
    if weight <= 0 or reps <= 0:
        return "error: weight and reps must be positive"
    d = to_iso(date)
    entries = [x for x in e["entries"] if x["date"] == d]
    prev_pr = max((x["max_weight"] for x in e["entries"]), default=None)
    r = api(f"/gym/lifts/{e['id']}", "PUT", params={"date": d}, json={"weight": weight, "reps": reps})
    note = f"overwrote {entries[0]['max_weight']:g}kg × {entries[0]['max_reps']}" if entries else "new entry"
    pr = " — new pr! 🏋️" if prev_pr is None or weight > prev_pr else ""
    return f"{e['name']} on {d}: {weight:g}kg × {reps} ({note}){pr}"


@mcp.tool
def gym_lift_history(exercise: str | int, limit: int = 10) -> str:
    """Recent logged sets for an exercise (by id or name), newest first."""
    e = resolve_exercise(exercise)
    entries = sorted(e["entries"], key=lambda x: x["date"], reverse=True)[: max(limit, 1)]
    if not entries:
        return f"{e['name']}: nothing logged yet"
    lines = [f"{e['name']} — last {len(entries)} of {len(e['entries'])} sessions:"]
    lines += [f"  {x['date']}  {x['max_weight']:g}kg × {x['max_reps']}" for x in entries]
    return "\n".join(lines)


@mcp.tool
def gym_remove_lift(entry_id: int) -> str:
    """Delete a lift entry by its id (see gym_lift_history / gym_list_exercises for ids)."""
    api(f"/gym/lifts/{entry_id}", "DELETE")
    return f"removed lift entry {entry_id}"


class BearerMiddleware:
    def __init__(self, app: Callable) -> None:
        self.app = app

    async def __call__(self, scope: dict, receive: Callable, send: Callable) -> None:
        if scope["type"] != "http" or not TOKEN:
            return await self.app(scope, receive, send)
        headers = dict(scope.get("headers") or [])
        auth = headers.get(b"authorization", b"").decode(errors="ignore")
        if auth != f"Bearer {TOKEN}":
            body = b'{"error":"unauthorized"}'
            await send({
                "type": "http.response.start",
                "status": 401,
                "headers": [(b"content-type", b"application/json"), (b"content-length", str(len(body)).encode())],
            })
            await send({"type": "http.response.body", "body": body})
            return
        return await self.app(scope, receive, send)


def create_app() -> Callable:
    core = mcp.http_app()
    return BearerMiddleware(core) if TOKEN else core


app = create_app()


if __name__ == "__main__":
    args = sys.argv[1:]
    mode = args[0] if args else "http"
    port = 8000
    if "--port" in args:
        port = int(args[args.index("--port") + 1])
    port = int(os.environ.get("PORT", str(port)))
    if mode == "stdio":
        mcp.run(transport="stdio")
    else:
        uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")