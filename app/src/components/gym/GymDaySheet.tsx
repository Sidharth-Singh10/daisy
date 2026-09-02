"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "@phosphor-icons/react";

import type { GymDayInfo, GymGroup } from "@/lib/types";
import { weekdayName } from "@/lib/dates";
import { groupColor } from "@/components/gym/colors";

const EASE = [0.32, 0.72, 0, 1] as const;

export function GymDaySheet({
  date,
  day,
  onClose,
  onToggle,
  onMarkAll,
  busy,
}: {
  date: string;
  day: GymDayInfo;
  onClose: () => void;
  onToggle: (groupId: number) => void;
  onMarkAll: () => void;
  busy: boolean;
}) {
  const done = day.groups.filter((g) => g.done).length;
  const allDone = done === day.groups.length && day.groups.length > 0;
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
                  {done}
                  <span className="text-daisy-muted/50">/{day.groups.length}</span>
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-daisy-muted">
                  {allDone ? "whole body trained" : "muscle groups trained"}
                </p>
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.3, ease: EASE }}
                onClick={onMarkAll}
                disabled={busy || allDone || day.groups.length === 0}
                className="rounded-full border border-daisy-green/40 bg-daisy-green/10 px-4 py-2.5 font-mono text-[11px] text-daisy-greenhi transition-colors duration-500 hover:bg-daisy-green/20 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
              >
                {allDone ? "all done" : "mark all done"}
              </motion.button>
            </div>
          </div>

          <div className="flex-1 space-y-1 px-6 pb-8">
            {day.groups.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/15 p-5 font-mono text-xs leading-relaxed text-daisy-muted">
                no muscle groups yet — add a few in the sidebar, then come back to log this day.
              </p>
            ) : (
              day.groups.map((g) => (
                <motion.button
                  key={g.id}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  onClick={() => onToggle(g.id)}
                  className="group flex w-full items-center gap-3 rounded-2xl border border-white/5 px-3.5 py-3 text-left transition-colors duration-500 hover:border-white/15 hover:bg-white/[0.03]"
                  style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
                >
                  {g.done ? (
                    <motion.span
                      initial={{ scale: 0.6 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.4, ease: EASE, type: "spring", stiffness: 300 }}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-daisy-bg"
                      style={{ backgroundColor: groupColor(g.id) }}
                    >
                      <Check size={13} weight="bold" />
                    </motion.span>
                  ) : (
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border opacity-40 transition-colors duration-500 group-hover:opacity-80"
                      style={{ borderColor: groupColor(g.id) }}
                    />
                  )}
                  <span
                    className={`flex-1 text-sm transition-colors duration-500 ${g.done ? "text-daisy-muted line-through decoration-daisy-muted/40" : "text-daisy-text"}`}
                  >
                    {g.name}
                  </span>
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: groupColor(g.id), opacity: g.done ? 1 : 0.25 }}
                  />
                </motion.button>
              ))
            )}
          </div>
        </motion.aside>
      </>
    </AnimatePresence>
  );
}