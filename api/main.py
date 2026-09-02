import sqlite3
from datetime import date as Date, timedelta
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import db

db.init_db()

app = FastAPI(title="daisy planner api", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict:
    return {"ok": True, "service": "daisy-planner-api"}


@app.get("/api/tasks")
def list_tasks(active: bool = Query(False)) -> list[dict]:
    return db.fetch_tasks(active_only=active)


class TaskCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    cadence: str = "daily"
    slot: int | None = None


class TaskUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    cadence: str | None = None
    slot: int | None = None
    active: bool | None = None
    position: int | None = None


def validate_task(cadence: str, slot: int | None) -> None:
    if cadence not in ("daily", "weekly", "monthly"):
        raise HTTPException(400, "cadence must be daily|weekly|monthly")
    if cadence == "weekly" and slot is not None and not 0 <= slot <= 6:
        raise HTTPException(400, "weekly slot must be 0-6")
    if cadence == "monthly" and slot is not None and not 1 <= slot <= 31:
        raise HTTPException(400, "monthly slot must be 1-31")


@app.post("/api/tasks", status_code=201)
def create_task(body: TaskCreate) -> dict:
    validate_task(body.cadence, body.slot)
    try:
        return db.create_task(body.name.strip(), body.cadence, body.slot)
    except (sqlite3.Error, AssertionError) as e:
        raise HTTPException(400, str(e)) from e


@app.patch("/api/tasks/{task_id}")
def patch_task(task_id: int, body: TaskUpdate) -> dict:
    if body.cadence is not None:
        validate_task(body.cadence, body.slot)
    fields = body.model_dump(exclude_none=True)
    task = db.update_task(task_id, fields)
    if not task:
        raise HTTPException(404, "task not found")
    return task


@app.delete("/api/tasks/{task_id}", status_code=204)
def remove_task(task_id: int) -> None:
    if not db.delete_task(task_id):
        raise HTTPException(404, "task not found")


@app.get("/api/calendar")
def calendar(month: str = Query(..., pattern=r"^\d{4}-\d{2}$")) -> dict:
    year, m = map(int, month.split("-"))
    days = db.month_days(year, m)
    tasks = db.fetch_tasks(active_only=True)
    keys = set()
    wk_start = db.weekly_key(days[0])
    wk_end = db.weekly_key(days[-1])
    for t in tasks:
        if t["cadence"] == "weekly":
            d = Date.fromisoformat(wk_start)
            while d.isoformat() <= wk_end:
                keys.add(d.isoformat())
                d += timedelta(days=7)
        elif t["cadence"] == "monthly":
            keys.add(days[0].strftime("%Y-%m-01"))
        else:
            keys.update(d.isoformat() for d in days)
    completions = db.fetch_completions(keys)

    day_map: dict[str, Any] = {}
    for d in days:
        row = []
        done = 0
        for t in tasks:
            key = db.resolve_key(t["cadence"], d)
            is_done = key in completions.get(t["id"], set())
            if is_done:
                done += 1
            row.append(
                {
                    "id": t["id"],
                    "name": t["name"],
                    "cadence": t["cadence"],
                    "slot": t["slot"],
                    "done": is_done,
                }
            )
        day_map[d.isoformat()] = {"done": done, "total": len(tasks), "tasks": row}
    return {"month": month, "days": day_map}


@app.put("/api/completions/{task_id}")
def toggle_completion(
    task_id: int,
    date: str = Query(..., pattern=r"^\d{4}-\d{2}-\d{2}$"),
    state: str | None = Query(None, pattern=r"^(done|undone)$"),
) -> dict:
    task = db.get_task(task_id)
    if not task:
        raise HTTPException(404, "task not found")
    try:
        d = Date.fromisoformat(date)
    except ValueError as e:
        raise HTTPException(400, "invalid date") from e
    key = db.resolve_key(task["cadence"], d)
    done = db.set_completion(task_id, key, state)
    return {"task_id": task_id, "period_key": key, "date": date, "done": done}


@app.get("/api/gym/groups")
def list_groups() -> list[dict]:
    return db.fetch_groups()


class GroupCreate(BaseModel):
    name: str = Field(min_length=1, max_length=40)


class GroupUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=40)
    position: int | None = None


@app.post("/api/gym/groups", status_code=201)
def create_group(body: GroupCreate) -> dict:
    try:
        return db.create_group(body.name.strip())
    except sqlite3.Error as e:
        raise HTTPException(400, "group name already exists") from e


@app.patch("/api/gym/groups/{group_id}")
def patch_group(group_id: int, body: GroupUpdate) -> dict:
    group = db.update_group(group_id, body.model_dump(exclude_none=True))
    if not group:
        raise HTTPException(404, "group not found")
    return group


@app.delete("/api/gym/groups/{group_id}", status_code=204)
def remove_group(group_id: int) -> None:
    if not db.delete_group(group_id):
        raise HTTPException(404, "group not found")


@app.get("/api/gym/calendar")
def gym_calendar(month: str = Query(..., pattern=r"^\d{4}-\d{2}$")) -> dict:
    year, m = map(int, month.split("-"))
    days = db.month_days(year, m)
    groups = db.fetch_groups()
    day_map = db.fetch_workout_days(days)
    return {
        "month": month,
        "days": {
            d.isoformat(): {
                "groups": [
                    {"id": g["id"], "name": g["name"], "done": g["id"] in day_map.get(d.isoformat(), set())}
                    for g in groups
                ]
            }
            for d in days
        },
    }


@app.put("/api/gym/workouts/{group_id}")
def toggle_workout(
    group_id: int,
    date: str = Query(..., pattern=r"^\d{4}-\d{2}-\d{2}$"),
    state: str | None = Query(None, pattern=r"^(done|undone)$"),
) -> dict:
    group = db.get_group(group_id)
    if not group:
        raise HTTPException(404, "group not found")
    try:
        Date.fromisoformat(date)
    except ValueError as e:
        raise HTTPException(400, "invalid date") from e
    done = db.set_workout_group(group_id, date, state)
    return {"group_id": group_id, "date": date, "done": done}


@app.get("/api/gym/stats")
def gym_stats() -> dict:
    return db.exercise_stats()