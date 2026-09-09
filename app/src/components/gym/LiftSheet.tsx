"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Trash, X } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

import type { ExerciseWithEntries } from "@/lib/types";
import { todayISO } from "@/lib/dates";
import * as api from "@/lib/api";
import { LiftChart } from "@/components/gym/LiftChart";

const EASE = [0.32, 0.72, 0, 1] as const;

function dateLabel(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return `${d.getDate()} ${d.toLocaleString("en-US", { month: "short" })}`;
}

function fmtWeight(v: number): string {
  return String(Number(v.toFixed(1)));
}

export function LiftSheet({
  exercise,
  color,
  onClose,
  onChanged,
}: {
  exercise: ExerciseWithEntries;
  color: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [metric, setMetric] = useState<"weight" | "reps">("weight");
  const [date, setDate] = useState(todayISO());
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entries = [...exercise.entries].sort((a, b) => a.date.localeCompare(b.date));
  const existing = entries.find((e) => e.date === date) ?? null;

  useEffect(() => {
    setWeight(existing ? String(existing.max_weight) : "");
    setReps(existing ? String(existing.max_reps) : "");
    // re-prefill when the picked date (or exercise) changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, exercise.id]);

  const chartData = entries.map((e) => ({
    date: e.date,
    value: metric === "weight" ? e.max_weight : e.max_reps,
  }));

  const bestWeight = entries.reduce<null | (typeof entries)[number]>(
    (best, e) => (!best || e.max_weight > best.max_weight ? e : best),
    null
  );
  const bestReps = entries.reduce<null | (typeof entries)[number]>(
    (best, e) => (!best || e.max_reps > best.max_reps ? e : best),
    null
  );

  const save = async () => {
    const w = parseFloat(weight);
    const r = parseInt(reps, 10);
    if (!isFinite(w) || w <= 0 || !Number.isInteger(r) || r <= 0) {
      setError("enter a valid weight and rep count");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.saveGymLift(exercise.id, date, { weight: w, reps: r });
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      onChanged();
    } catch {
      setError("could not save — try again");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (entryId: number) => {
    try {
      await api.deleteGymLift(entryId);
      onChanged();
    } catch {
      // keep the row if the delete failed
    }
  };

  const history = [...entries].reverse();

  return (
    <AnimatePresence>
      <>
        <motion.button
          type="button"
          aria-label="close lift sheet"
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
            <div className="flex min-w-0 items-center gap-3">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              <div className="min-w-0">
                <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-daisy-muted">
                  exercise progression
                </p>
                <p className="mt-1 truncate font-display text-3xl italic text-daisy-text">
                  {exercise.name}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="close"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-daisy-muted transition-colors duration-500 hover:text-daisy-text"
              style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
            >
              <X size={16} weight="light" />
            </button>
          </div>

          <div className="px-6">
            <div className="grid grid-cols-3 gap-2 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <div>
                <p className="font-mono text-xl text-daisy-text">
                  {bestWeight ? `${fmtWeight(bestWeight.max_weight)}kg` : "—"}
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-daisy-muted">
                  pr weight
                </p>
              </div>
              <div>
                <p className="font-mono text-xl text-daisy-text">{bestReps ? bestReps.max_reps : "—"}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-daisy-muted">
                  pr reps
                </p>
              </div>
              <div>
                <p className="font-mono text-xl text-daisy-text">{entries.length}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-daisy-muted">
                  sessions
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 pt-4">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-daisy-muted">
                  {metric === "weight" ? "max weight (kg)" : "max reps"}
                </p>
                <div className="flex gap-1 rounded-full border border-white/10 bg-white/5 p-1">
                  {(["weight", "reps"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMetric(m)}
                      className={`rounded-full px-3 py-1 font-mono text-[10px] transition-colors duration-500 ${
                        metric === m ? "bg-white/10 text-daisy-text" : "text-daisy-muted hover:text-daisy-text"
                      }`}
                      style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
                    >
                      {m === "weight" ? "kg" : "reps"}
                    </button>
                  ))}
                </div>
              </div>
              {chartData.length === 0 ? (
                <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-white/10 font-mono text-[10px] uppercase tracking-[0.2em] text-daisy-muted/40">
                  no entries yet
                </div>
              ) : (
                <LiftChart
                  data={chartData}
                  color={color}
                  height={170}
                  detailed
                  unit={metric === "weight" ? "kg" : ""}
                />
              )}
            </div>
          </div>

          <div className="px-6 pt-4">
            <div className="space-y-3 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-daisy-muted">
                  log a session
                </p>
                {existing && (
                  <span className="font-mono text-[10px] text-daisy-yellow">
                    overwrites {dateLabel(date)}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="date"
                  value={date}
                  max={todayISO()}
                  onChange={(e) => e.target.value && setDate(e.target.value)}
                  className="[color-scheme:dark] rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 font-mono text-xs text-daisy-text outline-none transition-colors duration-500 focus:border-daisy-green/40"
                  style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
                />
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.5"
                  placeholder="kg"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 font-mono text-xs text-daisy-text outline-none transition-colors duration-500 placeholder:text-daisy-muted/40 focus:border-daisy-green/40"
                  style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
                />
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  placeholder="reps"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 font-mono text-xs text-daisy-text outline-none transition-colors duration-500 placeholder:text-daisy-muted/40 focus:border-daisy-green/40"
                  style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
                />
              </div>
              {error && <p className="font-mono text-[10px] text-daisy-danger">{error}</p>}
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.3, ease: EASE }}
                onClick={() => void save()}
                disabled={busy}
                className={`w-full rounded-full border px-4 py-2.5 font-mono text-[11px] transition-colors duration-500 disabled:cursor-not-allowed disabled:opacity-40 ${
                  saved
                    ? "border-daisy-green/60 bg-daisy-green/20 text-daisy-greenhi"
                    : "border-daisy-green/40 bg-daisy-green/10 text-daisy-greenhi hover:bg-daisy-green/20"
                }`}
                style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
              >
                {saved ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <Check size={12} weight="bold" /> saved
                  </span>
                ) : existing ? (
                  "update entry"
                ) : (
                  "save entry"
                )}
              </motion.button>
            </div>
          </div>

          <div className="flex-1 space-y-1 px-6 pb-8 pt-5">
            <p className="pb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-daisy-muted">
              history
            </p>
            {history.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/15 p-5 font-mono text-xs leading-relaxed text-daisy-muted">
                nothing logged yet — pick any date above (past dates work too) and save your best set.
              </p>
            ) : (
              history.map((e) => {
                const isWeightPr = bestWeight?.id === e.id;
                const isRepsPr = bestReps?.id === e.id;
                return (
                  <div
                    key={e.id}
                    className="group flex items-center gap-3 rounded-2xl border border-white/5 px-3.5 py-3 transition-colors duration-500 hover:border-white/15"
                    style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                    <span className="font-mono text-sm text-daisy-text">{dateLabel(e.date)}</span>
                    <span className="ml-auto font-mono text-xs text-daisy-muted">
                      {fmtWeight(e.max_weight)} kg × {e.max_reps}
                    </span>
                    {isWeightPr && (
                      <span className="rounded-full border border-daisy-green/40 bg-daisy-green/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-daisy-greenhi">
                        pr
                      </span>
                    )}
                    {!isWeightPr && isRepsPr && (
                      <span className="rounded-full border border-daisy-yellow/40 bg-daisy-yellow/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-daisy-yellow">
                        reps pr
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => void remove(e.id)}
                      aria-label={`delete entry for ${e.date}`}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-daisy-muted/50 transition-colors duration-500 hover:text-daisy-danger"
                      style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
                    >
                      <Trash size={13} weight="light" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </motion.aside>
      </>
    </AnimatePresence>
  );
}
