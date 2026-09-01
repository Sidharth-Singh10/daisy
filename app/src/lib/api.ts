import type { CalendarResponse, Task, ToggleResponse } from "@/lib/types";

async function j<T>(r: Response): Promise<T> {
  if (!r.ok) throw new Error(await r.text());
  return (await r.json()) as T;
}

export function getTasks(): Promise<Task[]> {
  return fetch("/api/tasks").then((r) => j<Task[]>(r));
}

export function getCalendar(month: string): Promise<CalendarResponse> {
  return fetch(`/api/calendar?month=${month}`).then((r) => j<CalendarResponse>(r));
}

export function toggleCompletion(
  taskId: number,
  date: string,
  state?: "done" | "undone"
): Promise<ToggleResponse> {
  const q = state ? `&state=${state}` : "";
  return fetch(`/api/completions/${taskId}?date=${date}${q}`, { method: "PUT" }).then((r) => j<ToggleResponse>(r));
}

export function addTask(body: { name: string; cadence: string; slot: number | null }): Promise<Task> {
  return fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => j<Task>(r));
}

export function patchTask(
  id: number,
  body: Partial<{ name: string; cadence: string; slot: number | null; active: boolean; position: number }>
): Promise<Task> {
  return fetch(`/api/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => j<Task>(r));
}

export function deleteTask(id: number): Promise<void> {
  return fetch(`/api/tasks/${id}`, { method: "DELETE" }).then((r) => {
    if (!r.ok) throw new Error(r.statusText);
  });
}