"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

import { GymDaySheet } from "@/components/gym/GymDaySheet";
import { GymGrid } from "@/components/gym/GymGrid";
import { GroupPanel } from "@/components/gym/GroupPanel";
import { StatsCard } from "@/components/gym/StatsCard";
import { MonthRail } from "@/components/planner/MonthRail";
import { Eyebrow } from "@/components/BezCard";
import * as api from "@/lib/api";
import { addMonths, fmtMonth, todayISO } from "@/lib/dates";
import type { GymCalendarResponse, GymGroup, GymStats } from "@/lib/types";

const EASE = [0.32, 0.72, 0, 1] as const;

export default function GymPage() {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [groups, setGroups] = useState<GymGroup[]>([]);
  const [cal, setCal] = useState<GymCalendarResponse | null>(null);
  const [stats, setStats] = useState<GymStats>({ total: [], week: [] });
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const today = todayISO();

  const load = useCallback(async () => {
    setError(null);
    try {
      const [g, c, s] = await Promise.all([api.getGymGroups(), api.getGymCalendar(fmtMonth(month)), api.getGymStats()]);
      setGroups(g);
      setCal(c);
      setStats(s);
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

  const applyToggle = useCallback((groupId: number, date: string, done: boolean) => {
    setCal((prev) => {
      if (!prev) return prev;
      const day = prev.days[date];
      if (!day) return prev;
      return {
        ...prev,
        days: {
          ...prev.days,
          [date]: {
            ...day,
            groups: day.groups.map((g) => (g.id === groupId ? { ...g, done } : g)),
          },
        },
      };
    });
  }, []);

  const toggle = useCallback(
    async (groupId: number) => {
      if (!selected || !cal) return;
      const target = !cal.days[selected]?.groups.find((g) => g.id === groupId)?.done;
      applyToggle(groupId, selected, target);
      try {
        await api.toggleGymWorkout(groupId, selected);
        void load();
      } catch {
        void load();
      }
    },
    [applyToggle, cal, load, selected]
  );

  const markAll = useCallback(async () => {
    if (!selected || !cal) return;
    const pending = cal.days[selected]?.groups.filter((g) => !g.done) ?? [];
    if (pending.length === 0) return;
    setBusy(true);
    for (const g of pending) applyToggle(g.id, selected, true);
    try {
      await Promise.all(pending.map((g) => api.toggleGymWorkout(g.id, selected, "done")));
      void load();
    } catch {
      void load();
    } finally {
      setBusy(false);
    }
  }, [applyToggle, cal, load, selected]);

  const handleAdd = useCallback(
    async (name: string) => {
      await api.addGymGroup(name);
      void load();
    },
    [load]
  );

  const handlePatch = useCallback(
    async (id: number, body: { name?: string; position?: number }) => {
      await api.patchGymGroup(id, body);
      void load();
    },
    [load]
  );

  const handleDelete = useCallback(
    async (id: number) => {
      await api.deleteGymGroup(id);
      void load();
    },
    [load]
  );

  const selectedDay = cal?.days[selected ?? today] ?? null;
  const weekSessions = stats.week.reduce((s, c) => s + c.count, 0);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-28 md:pt-32">
      <motion.header
        initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.9, ease: EASE }}
        className="mb-10"
      >
        <Eyebrow>gym</Eyebrow>
        <h1 className="mt-4 font-display text-4xl italic leading-tight text-daisy-text md:text-5xl">
          lift heavy, <span className="text-daisy-greenhi">recover harder</span>.
        </h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[11px] text-daisy-muted">
            {groups.length} muscle groups
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[11px] text-daisy-muted">
            {weekSessions} sessions this week
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[11px] text-daisy-muted">
            {stats.total.reduce((s, c) => s + c.count, 0)} all time
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
          <GymGrid
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
              <StatsCard groups={groups} stats={stats} />
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
              <GroupPanel groups={groups} stats={stats} onAdd={handleAdd} onPatch={handlePatch} onDelete={handleDelete} />
            </div>
          </motion.div>
        </div>
      </div>

      {selected && selectedDay && (
        <GymDaySheet
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