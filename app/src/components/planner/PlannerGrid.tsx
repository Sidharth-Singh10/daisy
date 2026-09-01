"use client";

import { motion } from "framer-motion";

import type { CalendarResponse } from "@/lib/types";
import { WEEKDAY_LETTERS, monthMatrix, toISO } from "@/lib/dates";

const EASE = [0.32, 0.72, 0, 1] as const;

export function PlannerGrid({
  month,
  cal,
  selected,
  today,
  onSelect,
}: {
  month: Date;
  cal: CalendarResponse | null;
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
            const info = cal?.days[iso];
            const isToday = iso === today;
            const isSel = iso === selected;
            const outOfRange = d.getMonth() !== curMonth.getMonth();
            const pips = (info?.tasks ?? []).filter((t) => t.cadence === "daily");
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
                  className={`flex h-full min-h-[3.6rem] w-full flex-col items-center justify-center gap-1 rounded-[calc(1.35rem-0.25rem)] px-1 py-2 md:min-h-[4.4rem] ${
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
                  <span className="font-mono text-[10px] leading-none md:text-[11px]">
                    {info ? (
                      <span className={info.done === info.total ? "text-daisy-greenhi" : "text-daisy-text"}>
                        {info.done}
                        <span className="text-daisy-muted/50">/{info.total}</span>
                      </span>
                    ) : (
                      <span className="text-daisy-muted/30">–</span>
                    )}
                  </span>
                  <span className={`hidden flex-wrap justify-center gap-[3px] sm:flex ${inMonth ? "" : "opacity-30"}`}>
                    {pips.slice(0, 12).map((p) => (
                      <span
                        key={p.id}
                        className={`h-[5px] w-[5px] rounded-full transition-colors duration-500 ${
                          p.done ? "bg-daisy-greenhi" : "bg-white/15"
                        }`}
                      />
                    ))}
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