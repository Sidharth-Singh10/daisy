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

export interface GymGroup {
  id: number;
  name: string;
  position: number;
}

export interface GymDayGroup {
  id: number;
  name: string;
  done: boolean;
}

export interface GymDayInfo {
  groups: GymDayGroup[];
}

export interface GymCalendarResponse {
  month: string;
  days: Record<string, GymDayInfo>;
}

export interface GymCount {
  group_id: number;
  name: string;
  count: number;
}

export interface GymStats {
  total: GymCount[];
  week: GymCount[];
}

export interface GymWorkoutResponse {
  group_id: number;
  date: string;
  done: boolean;
}