"use client";

import { DotsSixVertical } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import { Eyebrow } from "@/components/BezCard";
import * as api from "@/lib/api";
import type { ExerciseWithEntries } from "@/lib/types";
import { groupColor } from "@/components/gym/colors";
import { LiftChart } from "@/components/gym/LiftChart";
import { LiftSheet } from "@/components/gym/LiftSheet";

const EASE = [0.32, 0.72, 0, 1] as const;

function fmtWeight(v: number): string {
  return String(Number(v.toFixed(1)));
}

export function LiftProgress() {
  const [exercises, setExercises] = useState<ExerciseWithEntries[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sheetId, setSheetId] = useState<number | null>(null);
  const [drag, setDrag] = useState<{ id: number; dx: number; dy: number } | null>(null);

  const dragInfo = useRef<{ id: number; startX: number; startY: number } | null>(null);
  const orderRef = useRef<ExerciseWithEntries[]>([]);
  orderRef.current = exercises;

  const load = useCallback(async () => {
    try {
      const list = await api.getGymExercises();
      const sorted = [...list].sort((a, b) => a.position - b.position || a.id - b.id);
      orderRef.current = sorted;
      setExercises(sorted);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed to reach the api");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const persistOrder = useCallback(async (ordered: ExerciseWithEntries[]) => {
    try {
      const jobs = ordered
        .map((it, i) => (it.position !== i ? api.patchGymExercise(it.id, { position: i }) : null))
        .filter((p): p is NonNullable<typeof p> => p !== null);
      if (jobs.length > 0) await Promise.all(jobs);
    } catch {
      void load();
    }
  }, [load]);

  const handlePointerDown = (e: React.PointerEvent, id: number) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragInfo.current = { id, startX: e.clientX, startY: e.clientY };
    setDrag({ id, dx: 0, dy: 0 });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const info = dragInfo.current;
    if (!info) return;
    const dx = e.clientX - info.startX;
    const dy = e.clientY - info.startY;
    setDrag((d) => (d && d.id === info.id ? { id: info.id, dx, dy } : d));

    // the dragged card ignores pointer events, so this resolves to whatever
    // card currently sits under the cursor
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const card = el?.closest("[data-exercise-id]") as HTMLElement | null;
    const targetId = card ? Number(card.dataset.exerciseId) : NaN;
    const cur = orderRef.current;
    const from = cur.findIndex((x) => x.id === info.id);
    const to = cur.findIndex((x) => x.id === targetId);
    if (from === -1 || to === -1 || from === to) return;
    const next = [...cur];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    orderRef.current = next;
    setExercises(next);
  };

  const handlePointerUp = () => {
    if (!dragInfo.current) return;
    dragInfo.current = null;
    setDrag(null);
    void persistOrder(orderRef.current);
  };

  const sheet = exercises.find((x) => x.id === sheetId) ?? null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.9, ease: EASE, delay: 0.25 }}
      className="mt-12"
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Eyebrow>progression</Eyebrow>
          <h2 className="mt-4 font-display text-2xl italic leading-tight text-daisy-text md:text-3xl">
            max lifts, <span className="text-daisy-greenhi">over time</span>.
          </h2>
        </div>
        <p className="font-mono text-[11px] text-daisy-muted">
          drag cards to rearrange · click to log &amp; backfill
        </p>
      </div>

      {error ? (
        <div className="rounded-[2rem] border border-daisy-danger/30 bg-daisy-danger/5 p-8">
          <p className="font-mono text-sm text-daisy-danger">api unreachable — {error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-5 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 font-mono text-xs text-daisy-text transition-colors duration-500 hover:border-daisy-green/40"
            style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
          >
            retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {exercises.map((ex) => {
            const color = groupColor(ex.id);
            const entries = [...ex.entries].sort((a, b) => a.date.localeCompare(b.date));
            const last = entries[entries.length - 1] ?? null;
            const isDragging = drag?.id === ex.id;
            return (
              <motion.div
                key={ex.id}
                layout
                data-exercise-id={ex.id}
                transition={{ duration: 0.45, ease: EASE }}
                style={{
                  x: isDragging ? drag.dx : 0,
                  y: isDragging ? drag.dy : 0,
                  scale: isDragging ? 1.04 : 1,
                  zIndex: isDragging ? 40 : 1,
                  pointerEvents: isDragging ? "none" : "auto",
                  boxShadow: isDragging ? "0 24px 48px rgba(0,0,0,0.45)" : "0 0 0 rgba(0,0,0,0)",
                  position: "relative",
                }}
                className="rounded-[2rem] border border-white/10 bg-white/5 p-1.5"
              >
                <div
                  className="rounded-[calc(2rem-0.375rem)] bg-daisy-surface p-5"
                  style={{ boxShadow: "inset 0 1px 1px rgba(255,255,255,0.15)" }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSheetId(ex.id)}
                      className="flex min-w-0 items-center gap-2 text-left"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="truncate font-mono text-sm text-daisy-text transition-colors duration-500 hover:text-daisy-greenhi">
                        {ex.name}
                      </span>
                    </button>
                    <span
                      onPointerDown={(e) => handlePointerDown(e, ex.id)}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerUp}
                      aria-label={`rearrange ${ex.name}`}
                      className="shrink-0 cursor-grab touch-none rounded-lg p-0.5 text-daisy-muted/40 transition-colors duration-500 hover:text-daisy-muted active:cursor-grabbing"
                      style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
                    >
                      <DotsSixVertical size={14} />
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSheetId(ex.id)}
                    className="mt-4 block w-full text-left"
                    aria-label={`open ${ex.name} progression`}
                  >
                    {entries.length === 0 ? (
                      <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-white/10 font-mono text-[10px] uppercase tracking-[0.2em] text-daisy-muted/40">
                        no entries yet
                      </div>
                    ) : (
                      <LiftChart
                        data={entries.map((e) => ({ date: e.date, value: e.max_weight }))}
                        color={color}
                        height={96}
                      />
                    )}
                  </button>

                  <div className="mt-3 flex items-baseline justify-between gap-2">
                    <span className="font-mono text-xs text-daisy-text">
                      {last ? `${fmtWeight(last.max_weight)} kg × ${last.max_reps}` : "—"}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-daisy-muted/60">
                      {entries.length} {entries.length === 1 ? "session" : "sessions"}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {sheet && (
        <LiftSheet
          exercise={sheet}
          color={groupColor(sheet.id)}
          onClose={() => setSheetId(null)}
          onChanged={() => void load()}
        />
      )}
    </motion.section>
  );
}
