"use client";

import { motion } from "framer-motion";

import type { GymCalendarResponse } from "@/lib/types";
import { WEEKDAY_LETTERS, monthMatrix, toISO } from "@/lib/dates";
import { groupColor } from "@/components/gym/colors";

const EASE = [0.32, 0.72, 0, 1] as const;

const MAX_CHIPS = 4;

export function GymGrid({
  month,
  cal,
  selected,
  today,
  onSelect,
}: {
  month: Date;
  cal: GymCalendarResponse | null;
  selected: string | null;
  today: string;
  onSelect: (iso: string, inMonth: boolean) => void;
}) {
  const weeks = monthMatrix(month);
  const now = new Date();
  const curMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-1.5">
      <div
        className="rounded-[calc(2rem-0.375rem)] bg-daisy-surface p-4 md:p-5"
        style={{ boxShadow: "inset 0 1px 1px rgba(255,255,255,0.15)" }}
      >
        <div className="grid grid-cols-7 gap-1.5 md:gap-2">
          {WEEKDAY_LETTERS.map((w, i) => (
            <div
              key={i}
              className="pb-2 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-daisy-muted/60"
            >
              {w}
            </div>
          ))}
          {weeks.flat().map((d) => {
            const iso = toISO(d);
            const inMonth = d.getMonth() === month.getMonth();
            const done = cal?.days[iso]?.groups.filter((g) => g.done) ?? [];
            const isToday = iso === today;
            const isSel = iso === selected;
            const outOfRange = d.getMonth() !== curMonth.getMonth();
            const overflow = done.length - MAX_CHIPS;
            return (
              <motion.button
                key={iso}
                type="button"
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.4, ease: EASE }}
                onClick={() => onSelect(iso, inMonth)}
                className={`rounded-[1.35rem] border p-1 transition-colors duration-500 ${
                  isSel
                    ? "border-daisy-green/70 bg-white/5"
                    : isToday
                      ? "border-daisy-yellow/60 bg-daisy-yellow/5"
                      : "border-white/10 bg-white/5 hover:border-daisy-green/40"
                }`}
                style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
              >
                <span
                  className={`flex h-full min-h-[3.6rem] w-full flex-col items-center justify-center gap-1 rounded-[calc(1.35rem-0.25rem)] px-1 py-2 md:min-h-[5rem] ${
                    inMonth ? "bg-daisy-raised/60" : "bg-white/[0.02]"
                  }`}
                >
                  <span
                    className={`font-mono text-xs md:text-sm ${
                      isToday
                        ? "text-daisy-yellow"
                        : inMonth
                          ? isSel
                            ? "text-daisy-greenhi"
                            : outOfRange
                              ? "text-daisy-muted/40"
                              : "text-daisy-text"
                          : "text-daisy-muted/35"
                    }`}
                  >
                    {d.getDate()}
                  </span>
                  {inMonth && done.length > 0 && (
                    <span className="font-mono text-[10px] leading-none text-daisy-muted/70 md:hidden">
                      {done.length}
                    </span>
                  )}
                  <span
                    className={`flex w-full flex-wrap justify-center gap-1 ${
                      inMonth ? "hidden md:flex" : "hidden"
                    }`}
                  >
                    {done.slice(0, MAX_CHIPS).map((g) => (
                      <span
                        key={g.id}
                        className="flex max-w-full items-center gap-1 rounded-full border border-white/10 bg-white/5 pl-1.5 pr-2 py-0.5"
                      >
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: groupColor(g.id) }}
                        />
                        <span className="max-w-[3.4rem] truncate font-mono text-[8px] leading-none text-daisy-muted">
                          {g.name}
                        </span>
                      </span>
                    ))}
                    {overflow > 0 && (
                      <span className="flex items-center rounded-full border border-dashed border-white/15 px-1.5 py-0.5 font-mono text-[8px] leading-none text-daisy-muted/70">
                        +{overflow}
                      </span>
                    )}
                    {done.length === 0 && (
                      <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-daisy-muted/30">
                        rest
                      </span>
                    )}
                  </span>
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}