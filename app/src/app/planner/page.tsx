"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

import { DaySheet } from "@/components/planner/DaySheet";
import { MonthRail } from "@/components/planner/MonthRail";
import { PlannerGrid } from "@/components/planner/PlannerGrid";
import { TaskPanel } from "@/components/planner/TaskPanel";
import { Eyebrow } from "@/components/BezCard";
import * as api from "@/lib/api";
import { addMonths, fmtMonth, todayISO } from "@/lib/dates";
import type { Cadence, CalendarResponse, Task } from "@/lib/types";

const EASE = [0.32, 0.72, 0, 1] as const;

export default function PlannerPage() {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [cal, setCal] = useState<CalendarResponse | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const today = todayISO();

  const load = useCallback(async () => {
    setError(null);
    try {
      const [t, c] = await Promise.all([api.getTasks(), api.getCalendar(fmtMonth(month))]);
      setTasks(t);
      setCal(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed to reach the api");
    }
  }, [month]);

  useEffect(() => {
    void load();
  }, [load]);

  const isCurrentMonth =
    month.getFullYear() === new Date().getFullYear() && month.getMonth() === new Date().getMonth();

  const goToday = () => {
    setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    setSelected(today);
  };

  const handleSelect = (iso: string, inMonth: boolean) => {
    setSelected(iso);
    if (!inMonth) {
      const d = new Date(iso + "T12:00:00");
      setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  };

  const applyToggle = useCallback((taskId: number, date: string, done: boolean) => {
    setCal((prev) => {
      if (!prev) return prev;
      const day = prev.days[date];
      if (!day) return prev;
      const delta = done ? 1 : -1;
      return {
        ...prev,
        days: {
          ...prev.days,
          [date]: {
            ...day,
            done: day.done + delta,
            tasks: day.tasks.map((t) => (t.id === taskId ? { ...t, done } : t)),
          },
        },
      };
    });
  }, []);

  const toggle = useCallback(
    async (taskId: number) => {
      if (!selected || !cal) return;
      const target = !cal.days[selected]?.tasks.find((t) => t.id === taskId)?.done;
      applyToggle(taskId, selected, target);
      try {
        await api.toggleCompletion(taskId, selected);
        void load();
      } catch {
        void load();
      }
    },
    [applyToggle, cal, load, selected]
  );

  const markAll = useCallback(async () => {
    if (!selected || !cal) return;
    const pending = cal.days[selected]?.tasks.filter((t) => !t.done) ?? [];
    if (pending.length === 0) return;
    setBusy(true);
    for (const t of pending) applyToggle(t.id, selected, true);
    try {
      await Promise.all(pending.map((t) => api.toggleCompletion(t.id, selected, "done")));
      void load();
    } catch {
      void load();
    } finally {
      setBusy(false);
    }
  }, [applyToggle, cal, load, selected]);

  const handleAdd = useCallback(
    async (p: { name: string; cadence: Cadence; slot: number | null }) => {
      await api.addTask({ name: p.name, cadence: p.cadence, slot: p.slot });
      void load();
    },
    [load]
  );

  const handlePatch = useCallback(
    async (id: number, body: Partial<Task>) => {
      await api.patchTask(id, body);
      void load();
    },
    [load]
  );

  const handleDelete = useCallback(
    async (id: number) => {
      await api.deleteTask(id);
      void load();
    },
    [load]
  );

  const selectedDay = selected ? cal?.days[selected] ?? null : null;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-28 md:pt-32">
      <motion.header
        initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.9, ease: EASE }}
        className="mb-10"
      >
        <Eyebrow>planner</Eyebrow>
        <h1 className="mt-4 font-display text-4xl italic leading-tight text-daisy-text md:text-5xl">
          water the garden <span className="text-daisy-greenhi">daily</span>.
        </h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[11px] text-daisy-muted">
            {tasks.filter((t) => t.active && t.cadence === "daily").length} daily
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[11px] text-daisy-muted">
            {tasks.filter((t) => t.active && t.cadence === "weekly").length} weekly
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[11px] text-daisy-muted">
            {tasks.filter((t) => t.active && t.cadence === "monthly").length} monthly
          </span>
        </div>
      </motion.header>

      {error ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="rounded-[2rem] border border-daisy-danger/30 bg-daisy-danger/5 p-8"
        >
          <p className="font-mono text-sm text-daisy-danger">api unreachable — {error}</p>
          <p className="mt-2 text-sm text-daisy-muted">
            start the api service (docker compose up / uvicorn main:app) then retry.
          </p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-5 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 font-mono text-xs text-daisy-text transition-colors duration-500 hover:border-daisy-green/40"
            style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
          >
            retry
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
          className="mb-8"
        >
          <MonthRail
            month={month}
            onPrev={() => setMonth((m) => addMonths(m, -1))}
            onNext={() => setMonth((m) => addMonths(m, 1))}
            onToday={goToday}
            isCurrentMonth={isCurrentMonth}
          />
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <PlannerGrid
            month={month}
            cal={cal}
            selected={selected}
            today={today}
            onSelect={handleSelect}
          />
        </div>
        <div className="space-y-6 xl:col-span-4">
          <motion.div
            initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}
            className="rounded-[2rem] border border-white/10 bg-white/5 p-1.5"
          >
            <div
              className="rounded-[calc(2rem-0.375rem)] bg-daisy-surface p-6"
              style={{ boxShadow: "inset 0 1px 1px rgba(255,255,255,0.15)" }}
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-daisy-muted">
                {selected ?? today}
              </p>
              <div className="mt-3 flex items-end justify-between">
                <p className="font-mono text-4xl text-daisy-text">
                  {selectedDay?.done ?? "–"}
                  <span className="text-daisy-muted/50">/{selectedDay?.total ?? "–"}</span>
                </p>
                <button
                  type="button"
                  onClick={() => setSelected(today)}
                  className="rounded-full border border-daisy-yellow/40 bg-daisy-yellow/10 px-4 py-2 font-mono text-[11px] text-daisy-yellow transition-colors duration-500 hover:bg-daisy-yellow/20"
                  style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
                >
                  jump to today
                </button>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: selectedDay ? `${(selectedDay.done / Math.max(selectedDay.total, 1)) * 100}%` : "0%",
                    background: "linear-gradient(90deg, #3fa656, #56c47a, #c9a227)",
                    transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)",
                  }}
                />
              </div>
              <div className="mt-4 flex gap-2">
                {(["daily", "weekly", "monthly"] as Cadence[]).map((c) => {
                  const n = selectedDay?.tasks.filter((t) => t.cadence === c && t.done).length ?? 0;
                  const total = selectedDay?.tasks.filter((t) => t.cadence === c).length ?? 0;
                  return (
                    <span key={c} className="flex-1 rounded-2xl border border-white/5 bg-white/[0.03] px-3 py-2 text-center">
                      <span className="block font-mono text-sm text-daisy-text">
                        {n}
                        <span className="text-daisy-muted/50">/{total}</span>
                      </span>
                      <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-widest text-daisy-muted">
                        {c}
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.3 }}
            className="rounded-[2rem] border border-white/10 bg-white/5 p-1.5"
          >
            <div
              className="rounded-[calc(2rem-0.375rem)] bg-daisy-surface p-6"
              style={{ boxShadow: "inset 0 1px 1px rgba(255,255,255,0.15)" }}
            >
              <TaskPanel tasks={tasks} onAdd={handleAdd} onPatch={handlePatch} onDelete={handleDelete} />
            </div>
          </motion.div>
        </div>
      </div>

      {selected && selectedDay && (
        <DaySheet
          date={selected}
          day={selectedDay}
          onClose={() => setSelected(null)}
          onToggle={toggle}
          onMarkAll={markAll}
          busy={busy}
        />
      )}
    </div>
  );
}