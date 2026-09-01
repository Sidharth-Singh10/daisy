"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Check, Lock } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";

import { Eyebrow } from "@/components/BezCard";
import data from "@/data/neetcode150.json";

const STORAGE_KEY = "daisy:leetcode:done";

type Difficulty = "Easy" | "Medium" | "Hard";

interface Problem {
  title: string;
  url: string;
  slug: string;
  difficulty: Difficulty;
  premium: boolean;
}

interface Topic {
  topic: string;
  problems: Problem[];
}

interface LeetcodeData {
  topics: Topic[];
  meta: { total: number; topics: number; premium: number };
}

const ncData = data as LeetcodeData;

const EASE = [0.32, 0.72, 0, 1] as const;

const SPANS = [7, 5, 6, 6, 8, 4, 5, 7, 6, 6, 4, 8, 7, 5, 6, 6, 5, 7];

const SPAN_CLASS: Record<number, string> = {
  4: "xl:col-span-4",
  5: "xl:col-span-5",
  6: "xl:col-span-6",
  7: "xl:col-span-7",
  8: "xl:col-span-8",
};

const DIFF_STYLES: Record<Difficulty, string> = {
  Easy: "border-daisy-green/30 bg-daisy-green/10 text-daisy-greenhi",
  Medium: "border-daisy-yellow/30 bg-daisy-yellow/10 text-daisy-yellow",
  Hard: "border-daisy-danger/30 bg-daisy-danger/10 text-daisy-danger",
};

export default function LeetcodePage() {
  const { topics, meta } = ncData;
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setDone(new Set(JSON.parse(raw) as string[]));
    } catch {
      setDone(new Set());
    }
  }, []);

  const toggle = useCallback((slug: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        localStorage.setItem(STORAGE_KEY, "[]");
      }
      return next;
    });
  }, []);

  const scrollTo = (i: number) => {
    document.getElementById(`topic-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-28 pt-28 md:pt-32">
      <motion.header
        initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.9, ease: EASE }}
        className="mb-8"
      >
        <Eyebrow>reference</Eyebrow>
        <h1 className="mt-4 font-display text-4xl italic leading-tight text-daisy-text md:text-5xl">
          NeetCode 150, <span className="text-daisy-greenhi">mapped to LeetCode</span>.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-daisy-muted">
          every problem from the NeetCode 150 list, grouped by pattern exactly like neetcode.io —
          with its real LeetCode link, difficulty, and premium locks.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[11px] text-daisy-muted">
            {meta.total} problems
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[11px] text-daisy-muted">
            {meta.topics} topics
          </span>
          <span className="rounded-full border border-daisy-green/30 bg-daisy-green/5 px-3 py-1.5 font-mono text-[11px] text-daisy-greenhi">
            {done.size}/{meta.total} logged
          </span>
          <span className="rounded-full border border-daisy-yellow/30 bg-daisy-yellow/5 px-3 py-1.5 font-mono text-[11px] text-daisy-yellow">
            {meta.premium} premium
          </span>
        </div>
      </motion.header>

      <div className="no-scrollbar sticky top-24 z-30 -mx-4 mb-10 overflow-x-auto px-4 pb-2">
        <div className="flex w-max gap-2">
          {topics.map((t, i) => (
            <button
              key={t.topic}
              type="button"
              onClick={() => scrollTo(i)}
              className="whitespace-nowrap rounded-full border border-white/10 bg-daisy-surface/90 px-3.5 py-1.5 font-mono text-[11px] text-daisy-muted backdrop-blur-xl transition-colors duration-500 hover:border-daisy-green/40 hover:text-daisy-greenhi"
              style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
            >
              {t.topic} · {t.problems.length}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-12">
        {topics.map((t, i) => (
          <motion.section
            key={t.topic}
            id={`topic-${i}`}
            initial={{ opacity: 0, y: 32, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, ease: EASE, delay: (i % 6) * 0.05 }}
            className={`scroll-mt-40 rounded-[2rem] border border-white/10 bg-white/5 p-1.5 md:col-span-1 ${SPAN_CLASS[SPANS[i]]}`}
          >
            <div
              className="h-full rounded-[calc(2rem-0.375rem)] bg-daisy-surface p-5 transition-colors duration-700 hover:border-white/5"
              style={{ boxShadow: "inset 0 1px 1px rgba(255,255,255,0.15)" }}
            >
              <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-white/5 pb-3">
                <h2 className="font-display text-lg italic text-daisy-text">{t.topic}</h2>
                <span className="font-mono text-[11px] text-daisy-muted">
                  {t.problems.filter((p) => done.has(p.slug)).length}/{t.problems.length} done
                  {t.problems.some((p) => p.premium) && (
                    <>
                      {" "}
                      ·{" "}
                      <span className="text-daisy-yellow">
                        {t.problems.filter((p) => p.premium).length} locked
                      </span>
                    </>
                  )}
                </span>
              </div>
              <ul className="space-y-0.5">
                {t.problems.map((p) => (
                  <li
                  key={p.slug}
                  className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition-colors duration-500 hover:bg-white/[0.04]"
                  style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
                >
                  <motion.button
                    type="button"
                    aria-label={`mark ${p.title} done`}
                    whileTap={{ scale: 0.82 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    onClick={() => toggle(p.slug)}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-500 ${
                      done.has(p.slug)
                        ? "border-daisy-greenhi bg-daisy-greenhi text-daisy-bg"
                        : "border-white/25 text-daisy-bg hover:border-daisy-greenhi/70"
                    }`}
                    style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
                  >
                    {done.has(p.slug) && (
                      <motion.span
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.35, type: "spring", stiffness: 350, damping: 18 }}
                      >
                        <Check size={11} weight="bold" />
                      </motion.span>
                    )}
                  </motion.button>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex min-w-0 flex-1 items-center justify-between gap-3"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className={`truncate text-sm transition-colors duration-500 ${
                          done.has(p.slug)
                            ? "text-daisy-muted/60 line-through decoration-daisy-muted/40"
                            : "text-daisy-text group-hover:text-daisy-greenhi"
                        }`}
                      >
                        {p.title}
                      </span>
                      {p.premium && (
                        <span className="flex shrink-0 items-center gap-1 rounded-full border border-daisy-yellow/40 bg-daisy-yellow/5 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-daisy-yellow">
                          <Lock size={9} weight="fill" /> premium
                        </span>
                      )}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${DIFF_STYLES[p.difficulty]}`}
                      >
                        {p.difficulty}
                      </span>
                      <span className="flex h-7 w-7 -translate-x-1 items-center justify-center rounded-full border border-white/10 bg-white/5 text-daisy-greenhi opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100">
                        <ArrowUpRight size={12} weight="light" />
                      </span>
                    </span>
                  </a>
                </li>
                ))}
              </ul>
            </div>
          </motion.section>
        ))}
      </div>

      <p className="mt-14 text-center font-mono text-[11px] text-daisy-muted/60">
        {meta.total} problems · {meta.topics} topics · {meta.premium} premium — generated from
        neetcode150_leetcode_links.txt
      </p>
    </div>
  );
}