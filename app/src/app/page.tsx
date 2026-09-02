"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "@phosphor-icons/react";
import Link from "next/link";

import { DaisyMark } from "@/components/DaisyLogo";

const EASE = [0.32, 0.72, 0, 1] as const;

function fader(delay: number, y = 28) {
  return {
    initial: { opacity: 0, y, filter: "blur(8px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: 0.9, ease: EASE, delay },
  };
}

export default function HomePage() {
  return (
    <section className="flex min-h-[100dvh] flex-col items-center justify-center px-4 py-24 text-center">
      <motion.div {...fader(0)} className="relative mb-10 h-36 w-36">
        <motion.div
          className="absolute inset-2 rounded-full border border-daisy-yellow/25"
          animate={{ scale: [1, 1.07, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
        >
          <DaisyMark size={144} className="drop-shadow-[0_0_24px_rgba(63,166,86,0.25)]" />
        </motion.div>
      </motion.div>

      <motion.p
        {...fader(0.15)}
        className="mb-6 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-daisy-muted"
      >
        daisy · bloom 01
      </motion.p>

      <motion.h1
        {...fader(0.25)}
        className="max-w-3xl font-display text-5xl italic leading-[1.05] text-daisy-text md:text-7xl"
      >
        something is sprouting&nbsp;here.
      </motion.h1>

      <motion.p {...fader(0.35)} className="mt-6 font-mono text-sm text-daisy-muted">
        status: under construction — planner + gym + leetcode live
      </motion.p>

      <motion.div {...fader(0.45)} className="mt-12 flex flex-wrap items-center justify-center gap-3">
        {[
          { href: "/planner", label: "planner" },
          { href: "/gym", label: "gym" },
          { href: "/leetcode", label: "leetcode" },
        ].map((l) => (
          <motion.div key={l.href} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.4, ease: EASE }}>
            <Link
              href={l.href}
              className="group flex items-center gap-2 rounded-full border border-white/10 bg-daisy-surface px-6 py-3 text-sm text-daisy-text transition-colors duration-500 hover:border-daisy-green/40"
              style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
            >
              {l.label}
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-daisy-greenhi transition-all duration-700 group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105 group-hover:bg-daisy-green/25">
                <ArrowUpRight size={14} weight="light" />
              </span>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <motion.p {...fader(0.6)} className="mt-20 font-mono text-xs text-daisy-muted/60">
        daisy · grown in the dark · 2026
      </motion.p>
    </section>
  );
}