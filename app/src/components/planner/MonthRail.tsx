"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { motion } from "framer-motion";

import { monthLabel } from "@/lib/dates";

const EASE = [0.32, 0.72, 0, 1] as const;

export function MonthRail({
  month,
  onPrev,
  onNext,
  onToday,
  isCurrentMonth,
}: {
  month: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  isCurrentMonth: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <motion.button
          type="button"
          aria-label="previous month"
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.94 }}
          transition={{ duration: 0.4, ease: EASE }}
          onClick={onPrev}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-daisy-muted transition-colors duration-500 hover:text-daisy-text"
          style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
        >
          <CaretLeft size={16} weight="light" />
        </motion.button>
        <motion.button
          type="button"
          aria-label="next month"
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.94 }}
          transition={{ duration: 0.4, ease: EASE }}
          onClick={onNext}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-daisy-muted transition-colors duration-500 hover:text-daisy-text"
          style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
        >
          <CaretRight size={16} weight="light" />
        </motion.button>
        <h1 className="font-display text-2xl italic text-daisy-text md:text-3xl">
          {monthLabel(month)}
        </h1>
      </div>
      {!isCurrentMonth && (
        <button
          type="button"
          onClick={onToday}
          className="rounded-full border border-daisy-green/40 bg-daisy-green/10 px-4 py-2 font-mono text-xs text-daisy-greenhi transition-colors duration-500 hover:bg-daisy-green/20"
          style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
        >
          back to today
        </button>
      )}
    </div>
  );
}