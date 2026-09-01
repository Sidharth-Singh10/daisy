"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "@phosphor-icons/react";

import type { DayInfo } from "@/lib/types";
import { WEEKDAY_LETTERS, ordinal, weekdayName } from "@/lib/dates";

const EASE = [0.32, 0.72, 0, 1] as const;

const SECTIONS = [
  { key: "daily", label: "today", sub: "" },
  { key: "weekly", label: "this week", sub: "counts once per week" },
  { key: "monthly", label: "this month", sub: "counts once per month" },
] as const;

export function DaySheet({
  date,
  day,
  onClose,
  onToggle,
  onMarkAll,
  busy,
}: {
  date: string;
  day: DayInfo;
  onClose: () => void;
  onToggle: (taskId: number) => void;
  onMarkAll: () => void;
  busy: boolean;
}) {
  const total = day.total;
  const allDone = day.done === total && total > 0;
  return (
    <AnimatePresence>
      <>
        <motion.button
          type="button"
          aria-label="close day sheet"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="fixed inset-0 z-50 cursor-default bg-black/60 backdrop-blur-sm"
        />
        <motion.aside
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.6, ease: EASE }}
          className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-white/10 bg-daisy-surface"
        >
          <div className="flex items-start justify-between p-6 pb-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-daisy-muted">
                {weekdayName(date)} · {date}
              </p>
              <p className="mt-1 font-display text-3xl italic text-daisy-text">
                {new Date(date + "T12:00:00").getDate()}{" "}
                {new Date(date + "T12:00:00").toLocaleString("en-US", { month: "long" })}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="close"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-daisy-muted transition-colors duration-500 hover:text-daisy-text"
              style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
            >
              <X size={16} weight="light" />
            </button>
          </div>

          <div className="px-6 pb-6">
            <div className="flex items-end justify-between rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <div>
                <p className="font-mono text-4xl text-daisy-text">
                  {day.done}
                  <span className="text-daisy-muted/50">/{total}</span>
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-daisy-muted">
                  {allDone ? "all petals bloomed" : "petals bloomed"}
                </p>
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.3, ease: EASE }}
                onClick={onMarkAll}
                disabled={busy || allDone}
                className="rounded-full border border-daisy-green/40 bg-daisy-green/10 px-4 py-2.5 font-mono text-[11px] text-daisy-greenhi transition-colors duration-500 hover:bg-daisy-green/20 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
              >
                {allDone ? "all done" : "mark all done"}
              </motion.button>
            </div>
          </div>

          <div className="flex-1 space-y-7 px-6 pb-8">
            {SECTIONS.map((s) => {
              const items = day.tasks.filter((t) => t.cadence === s.key);
              if (items.length === 0 && s.key !== "daily") return null;
              return (
                <section key={s.key} className="border-t border-white/5 pt-5">
                  <div className="mb-3 flex items-center gap-2.5">
                    <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-daisy-muted">
                      {s.label}
                    </h3>
                    <span className="font-mono text-[10px] text-daisy-muted/50">{s.sub}</span>
                  </div>
                  <ul className="space-y-1">
                    {items.map((t) => {
                      const slotLabel =
                        t.cadence === "weekly" && t.slot !== null
                          ? WEEKDAY_LETTERS[t.slot]
                          : t.cadence === "monthly" && t.slot !== null
                            ? ordinal(t.slot)
                            : null;
                      return (
                        <li key={t.id}>
                          <motion.button
                            type="button"
                            whileTap={{ scale: 0.97 }}
                            transition={{ duration: 0.3, ease: EASE }}
                            onClick={() => onToggle(t.id)}
                            className="group flex w-full items-center gap-3 rounded-2xl border border-white/5 px-3.5 py-3 text-left transition-colors duration-500 hover:border-white/15 hover:bg-white/[0.03]"
                            style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
                          >
                            {t.done ? (
                              <motion.span
                                initial={{ scale: 0.6 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.4, ease: EASE, type: "spring", stiffness: 300 }}
                                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-daisy-greenhi bg-daisy-greenhi text-daisy-bg"
                              >
                                <Check size={13} weight="bold" />
                              </motion.span>
                            ) : (
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/25 transition-colors duration-500 group-hover:border-daisy-greenhi/70" />
                            )}
                            <span className={`flex-1 text-sm transition-colors duration-500 ${t.done ? "text-daisy-muted line-through decoration-daisy-muted/40" : "text-daisy-text"}`}>
                              {t.name}
                            </span>
                            {slotLabel && (
                              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-daisy-muted">
                                {t.cadence === "weekly" ? `every ${slotLabel}` : `the ${slotLabel}`}
                              </span>
                            )}
                          </motion.button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        </motion.aside>
      </>
    </AnimatePresence>
  );
}