# daisy

A dark-mode checklist planner + gym tracker + NeetCode 150 → LeetCode reference. (juss procrastination pro maxx )

<img width="2485" height="1342" alt="image" src="https://github.com/user-attachments/assets/c7495418-bf5e-4bbc-bee9-0c738f3e2df9" />

<img width="2497" height="1331" alt="image" src="https://github.com/user-attachments/assets/9c8a557d-1ef5-4844-893e-ed2bab32cd47" />

<img width="2482" height="1324" alt="image" src="https://github.com/user-attachments/assets/426af383-66de-4442-8670-4ac1aca683c7" />

<img width="2490" height="1327" alt="image" src="https://github.com/user-attachments/assets/e1a06698-fb80-4117-88d3-71ccf8be1d31" />


- `/` — under construction hero
- `/planner` — month calendar with per-day `X/N` completion (daily / weekly / monthly tasks)
- `/gym` — workout calendar: log which muscle groups you trained per day, with all-time + weekly frequency stats
- `/leetcode` — all 150 NeetCode problems, grouped by pattern, mapped to LeetCode

## Architecture

```
app/    Next.js 15 (App Router, Tailwind v4, framer-motion, Geist + Fraunces)
api/    FastAPI + SQLite (tasks, completions, calendar + gym workouts, muscle groups, stats)
mcp/    fastmcp stdio server — agents update the planner over HTTP
scripts/parse_leetcode.py — neetcode150_leetcode_links.txt → app/src/data/neetcode150.json
```

Periods: daily = the date; weekly = ISO week (Monday key, checked once per week);
monthly = calendar month (1st key, checked once per month).

## Run

```bash
sudo systemctl start docker   # daemon must be running
docker compose up -d --build
# web → http://localhost:3000   api → http://localhost:8000
```

SQLite lives in the `daisy-data` docker volume. Seed on first boot: 8 daily tasks
(headlamp, servo, NEETCODE150, system-design, rjagro, zerodha, anvil, gym).

### Local dev (no docker)

```bash
python3 -m venv .venv && . .venv/bin/activate
pip install -r api/requirements.txt -r mcp/requirements.txt
uvicorn main:app --port 8000 --app-dir api &        # api
cd app && npm install && npm run dev                # web (rewrites /api → localhost:8000)
```

## Agents (MCP)

The MCP server runs as a **streamable-HTTP** service (compose `mcp` service,
published on `127.0.0.1:7004` for host agents; container agents reach it at
`http://mcp:8000/mcp` over the docker network). Optionally set `MCP_TOKEN` in
`.env` to require `Authorization: Bearer <token>`.

Host agents (`opencode.json`):

```json
{
  "mcp": {
    "daisy-planner": {
      "type": "remote",
      "url": "http://localhost:7004/mcp",
      "headers": { "Authorization": "Bearer <MCP_TOKEN>" }
    }
  }
}
```

Container agents:

```json
{
  "mcp": {
    "daisy-planner": {
      "type": "remote",
      "url": "http://mcp:8000/mcp",
      "headers": { "Authorization": "Bearer <MCP_TOKEN>" }
    }
  }
}
```

stdio mode is still available for ad-hoc runs: `python mcp/server.py stdio`.

Tools: `planner_list_tasks`, `planner_add_task`, `planner_update_task`,
`planner_remove_task`, `planner_check` (done/undone/toggle), `planner_status`,
`gym_list_groups`, `gym_add_group`, `gym_rename_group`, `gym_remove_group`,
`gym_log`, `gym_stats`.

Reminder pattern — an agent (cron or a scheduled opencode run) calls
`planner_status(date: "today")`, reads the pending list, and reminds you.

## API

| Method | Path | Notes |
|---|---|---|
| GET | `/api/health` | |
| GET | `/api/tasks?active=1` | list tasks |
| POST | `/api/tasks` | `{name, cadence, slot}` |
| PATCH | `/api/tasks/{id}` | `{name?, cadence?, slot?, active?, position?}` |
| DELETE | `/api/tasks/{id}` | cascades completions |
| GET | `/api/calendar?month=YYYY-MM` | per-day `{done, total, tasks[]}` |
| PUT | `/api/completions/{id}?date=YYYY-MM-DD[&state=done\|undone]` | toggle or set |
| GET | `/api/gym/groups` | list muscle groups |
| POST | `/api/gym/groups` | `{name}` |
| PATCH | `/api/gym/groups/{id}` | `{name?, position?}` |
| DELETE | `/api/gym/groups/{id}` | cascades workout history |
| GET | `/api/gym/calendar?month=YYYY-MM` | per-day `{groups[]}` |
| PUT | `/api/gym/workouts/{id}?date=YYYY-MM-DD[&state=done\|undone]` | toggle or set |
| GET | `/api/gym/stats` | all-time + this-week frequencies |

Weekly `slot` = weekday 0–6 (Mon=0); monthly `slot` = day 1–31.

## Regenerate leetcode data

```bash
python3 scripts/parse_leetcode.py neetcode150_leetcode_links.txt app/src/data/neetcode150.json
```

## Theme

"Daisy Dark" — bg `#0C100D`, surface `#131A15`, green `#3FA656`, darkish yellow
`#C9A227`, text `#F4F7F4`. Fonts: Fraunces (display), Geist (sans/mono).
