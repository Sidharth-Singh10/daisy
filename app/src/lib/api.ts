import type { CalendarResponse, ExerciseWithEntries, GymCalendarResponse, GymGroup, GymStats, GymWorkoutResponse, LiftEntry, Task, ToggleResponse } from "@/lib/types";

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

export function getGymGroups(): Promise<GymGroup[]> {
  return fetch("/api/gym/groups").then((r) => j<GymGroup[]>(r));
}

export function getGymCalendar(month: string): Promise<GymCalendarResponse> {
  return fetch(`/api/gym/calendar?month=${month}`).then((r) => j<GymCalendarResponse>(r));
}

export function getGymStats(): Promise<GymStats> {
  return fetch("/api/gym/stats").then((r) => j<GymStats>(r));
}

export function toggleGymWorkout(
  groupId: number,
  date: string,
  state?: "done" | "undone"
): Promise<GymWorkoutResponse> {
  const q = state ? `&state=${state}` : "";
  return fetch(`/api/gym/workouts/${groupId}?date=${date}${q}`, { method: "PUT" }).then((r) => j<GymWorkoutResponse>(r));
}

export function addGymGroup(name: string): Promise<GymGroup> {
  return fetch("/api/gym/groups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  }).then((r) => j<GymGroup>(r));
}

export function patchGymGroup(id: number, body: { name?: string; position?: number }): Promise<GymGroup> {
  return fetch(`/api/gym/groups/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => j<GymGroup>(r));
}

export function deleteGymGroup(id: number): Promise<void> {
  return fetch(`/api/gym/groups/${id}`, { method: "DELETE" }).then((r) => {
    if (!r.ok) throw new Error(r.statusText);
  });
}

export function getGymExercises(): Promise<ExerciseWithEntries[]> {
  return fetch("/api/gym/exercises").then((r) => j<ExerciseWithEntries[]>(r));
}

export function patchGymExercise(id: number, body: { name?: string; position?: number }): Promise<ExerciseWithEntries> {
  return fetch(`/api/gym/exercises/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => j<ExerciseWithEntries>(r));
}

export function saveGymLift(
  exerciseId: number,
  date: string,
  body: { weight: number; reps: number }
): Promise<LiftEntry> {
  return fetch(`/api/gym/lifts/${exerciseId}?date=${date}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => j<LiftEntry>(r));
}

export function deleteGymLift(entryId: number): Promise<void> {
  return fetch(`/api/gym/lifts/${entryId}`, { method: "DELETE" }).then((r) => {
    if (!r.ok) throw new Error(r.statusText);
  });
}