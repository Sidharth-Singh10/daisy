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