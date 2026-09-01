"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, CaretDown, CaretUp, PencilSimple, Plus, Trash, X } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

import type { Cadence, Task } from "@/lib/types";
import { WEEKDAY_LETTERS, ordinal } from "@/lib/dates";

const EASE = [0.32, 0.72, 0, 1] as const;

const CADENCES: Cadence[] = ["daily", "weekly", "monthly"];

function slotLabel(t: Task): string {
  if (t.cadence === "weekly" && t.slot !== null) return `every ${WEEKDAY_LETTERS[t.slot]}`;
  if (t.cadence === "monthly" && t.slot !== null) return `the ${ordinal(t.slot)}`;
  return "";
}

export function TaskForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Task | null;
  onSubmit: (payload: { name: string; cadence: Cadence; slot: number | null }) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [cadence, setCadence] = useState<Cadence>(initial?.cadence ?? "daily");
  const [slot, setSlot] = useState<number | null>(initial?.slot ?? null);

  const segmented = (options: { value: string; label: string }[]) => (
    <div className="flex rounded-full border border-white/10 bg-white/5 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => setCadence(o.value as Cadence)}
          className={`flex-1 rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors duration-500 ${
            cadence === o.value
              ? "bg-daisy-green/20 text-daisy-greenhi"
              : "text-daisy-muted hover:text-daisy-text"
          }`}
          style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-3">
      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) onSubmit({ name: name.trim(), cadence, slot });
          }}
          placeholder={initial ? "rename task" : "new task"}
          autoFocus={!!initial}
          className="w-full flex-1 rounded-full border border-white/10 bg-daisy-raised px-4 py-2.5 text-sm text-daisy-text placeholder:text-daisy-muted/50 focus:border-daisy-green/50 focus:outline-none"
          style={{ boxShadow: "inset 0 1px 1px rgba(255,255,255,0.12)" }}
        />
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          transition={{ duration: 0.3, ease: EASE }}
          onClick={() => name.trim() && onSubmit({ name: name.trim(), cadence, slot })}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-daisy-green text-daisy-bg"
          aria-label="save task"
        >
          {initial ? <CheckIcon size={15} weight="bold" /> : <Plus size={15} weight="bold" />}
        </motion.button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            aria-label="cancel edit"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-daisy-muted hover:text-daisy-text"
          >
            <X size={14} weight="light" />
          </button>
        )}
      </div>
      <div className="mt-3">{segmented(CADENCES.map((c) => ({ value: c, label: c })))}</div>
      {cadence === "weekly" && (
        <div className="mt-3 flex gap-1">
          {WEEKDAY_LETTERS.map((w, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSlot(i)}
              className={`flex-1 rounded-full border py-1.5 font-mono text-[10px] transition-colors duration-500 ${
                slot === i
                  ? "border-daisy-yellow/50 bg-daisy-yellow/10 text-daisy-yellow"
                  : "border-white/10 text-daisy-muted hover:text-daisy-text"
              }`}
              style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
            >
              {w}
            </button>
          ))}
        </div>
      )}
      {cadence === "monthly" && (
        <div className="mt-3 flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-daisy-muted">scheduled day</span>
          <select
            value={slot ?? 1}
            onChange={(e) => setSlot(Number(e.target.value))}
            className="rounded-full border border-white/10 bg-daisy-raised px-3 py-1.5 font-mono text-xs text-daisy-text focus:border-daisy-yellow/50 focus:outline-none"
          >
            {Array.from({ length: 31 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {ordinal(n)}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

function CheckIcon({ size, weight }: { size: number; weight: "bold" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M216 72 104 184 40 120" />
    </svg>
  );
}

export function TaskPanel({
  tasks,
  onAdd,
  onPatch,
  onDelete,
}: {
  tasks: Task[];
  onAdd: (payload: { name: string; cadence: Cadence; slot: number | null }) => Promise<void>;
  onPatch: (id: number, body: Partial<Task>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [armed, setArmed] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const sorted = [...tasks].sort((a, b) => a.position - b.position);

  const swap = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= sorted.length) return;
    const a = sorted[i];
    const b = sorted[j];
    void onPatch(a.id, { position: b.position });
    void onPatch(b.id, { position: a.position });
  };

  const armDelete = (id: number) => {
    if (armed === id) {
      setArmed(null);
      void onDelete(id);
      return;
    }
    setArmed(id);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setArmed(null), 3000);
  };

  const active = sorted.filter((t) => t.active);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl italic text-daisy-text">tasks</h2>
        <span className="font-mono text-[11px] text-daisy-muted">{active.length} growing</span>
      </div>

      {!showForm && (
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.3, ease: EASE }}
          onClick={() => setShowForm(true)}
          className="group flex w-full items-center gap-2 rounded-full border border-dashed border-white/15 px-5 py-3 font-mono text-xs text-daisy-muted transition-colors duration-500 hover:border-daisy-green/50 hover:text-daisy-greenhi"
          style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
        >
          plant a new task
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-daisy-greenhi transition-transform duration-700 group-hover:rotate-90">
            <Plus size={12} weight="light" />
          </span>
        </motion.button>
      )}
      {showForm && (
        <TaskForm
          onSubmit={(p) => {
            setShowForm(false);
            void onAdd(p);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <ul className="space-y-1.5">
        {sorted.map((t, i) => {
          const label = slotLabel(t);
          return (
            <li
              key={t.id}
              className="rounded-[1.35rem] border border-white/10 bg-white/5 p-1.5"
            >
              <div className="flex items-center gap-2 rounded-[calc(1.35rem-0.25rem)] bg-daisy-raised/50 px-3 py-2.5">
                {!t.active ? null : (
                  <div className="flex flex-col">
                    <button
                      type="button"
                      aria-label="move up"
                      onClick={() => swap(i, -1)}
                      disabled={i === 0}
                      className="text-daisy-muted/60 transition-colors duration-300 hover:text-daisy-text disabled:opacity-20"
                    >
                      <CaretUp size={11} weight="light" />
                    </button>
                    <button
                      type="button"
                      aria-label="move down"
                      onClick={() => swap(i, 1)}
                      disabled={i === sorted.length - 1}
                      className="text-daisy-muted/60 transition-colors duration-300 hover:text-daisy-text disabled:opacity-20"
                    >
                      <CaretDown size={11} weight="light" />
                    </button>
                  </div>
                )}
                {editing === t.id ? (
                  <div className="flex-1">
                    <TaskForm
                      initial={t}
                      onCancel={() => setEditing(null)}
                      onSubmit={(p) => {
                        setEditing(null);
                        void onPatch(t.id, p);
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <span className={`flex-1 truncate text-sm ${t.active ? "text-daisy-text" : "text-daisy-muted/50 line-through"}`}>
                      {t.name}
                    </span>
                    <span className="hidden shrink-0 items-center gap-1.5 sm:flex">
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-daisy-muted">
                        {t.cadence}
                      </span>
                      {label && (
                        <span className="rounded-full border border-daisy-yellow/25 bg-daisy-yellow/5 px-2.5 py-1 font-mono text-[10px] text-daisy-yellow">
                          {label}
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      aria-label="edit task"
                      onClick={() => setEditing(t.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-daisy-muted transition-colors duration-300 hover:bg-white/5 hover:text-daisy-text"
                    >
                      <PencilSimple size={13} weight="light" />
                    </button>
                    <button
                      type="button"
                      aria-label="delete task"
                      onClick={() => armDelete(t.id)}
                      className={`flex h-8 items-center justify-center gap-1 rounded-full px-2 font-mono text-[10px] transition-colors duration-300 ${
                        armed === t.id
                          ? "bg-daisy-danger/15 text-daisy-danger"
                          : "w-8 text-daisy-muted hover:bg-white/5 hover:text-daisy-danger"
                      }`}
                    >
                      {armed === t.id ? (
                        <>
                          <Trash size={11} weight="light" /> sure?
                        </>
                      ) : (
                        <Trash size={13} weight="light" />
                      )}
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}