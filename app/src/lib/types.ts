export type Cadence = "daily" | "weekly" | "monthly";

export interface Task {
  id: number;
  name: string;
  cadence: Cadence;
  slot: number | null;
  position: number;
  active: boolean;
}

export interface DayTask {
  id: number;
  name: string;
  cadence: Cadence;
  slot: number | null;
  done: boolean;
}

export interface DayInfo {
  done: number;
  total: number;
  tasks: DayTask[];
}

export interface CalendarResponse {
  month: string;
  days: Record<string, DayInfo>;
}

export interface ToggleResponse {
  task_id: number;
  period_key: string;
  date: string;
  done: boolean;
}