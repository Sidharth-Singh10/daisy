"use client";

import { motion } from "framer-motion";

import type { GymCount, GymGroup } from "@/lib/types";
import { groupColor } from "@/components/gym/colors";

const EASE = [0.32, 0.72, 0, 1] as const;

function ranked(groups: GymGroup[], counts: GymCount[]): { group: GymGroup; count: number }[] {
  const byId = new Map(counts.map((c) => [c.group_id, c.count]));
  return groups
    .map((g) => ({ group: g, count: byId.get(g.id) ?? 0 }))
    .sort((a, b) => b.count - a.count);
}

function Section({ title, rows }: { title: string; rows: { group: GymGroup; count: number }[] }) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  const total = rows.reduce((s, r) => s + r.count, 0);
  return (
    <section className="border-t border-white/5 pt-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-daisy-muted">{title}</h3>
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-daisy-muted">
          {total} session{total === 1 ? "" : "s"}
        </span>
      </div>
      {rows.every((r) => r.count === 0) ? (
        <p className="rounded-2xl border border-dashed border-white/15 p-4 font-mono text-xs text-daisy-muted">
          nothing logged yet
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map(({ group, count }) => (
            <li key={group.id} className={count === 0 ? "opacity-45" : ""}>
              <div className="flex items-center gap-2.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: groupColor(group.id) }}
                />
                <span className={`flex-1 truncate text-sm ${count > 0 ? "text-daisy-text" : "text-daisy-muted"}`}>
                  {group.name}
                </span>
                <span className="font-mono text-xs text-daisy-text">
                  {count}
                  <span className="text-daisy-muted/50">×</span>
                </span>
              </div>
              <div className="ml-[17px] mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(count / max) * 100}%` }}
                  transition={{ duration: 0.8, ease: EASE }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: groupColor(group.id), opacity: count > 0 ? 0.9 : 0 }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function StatsCard({ groups, stats }: { groups: GymGroup[]; stats: { total: GymCount[]; week: GymCount[] } }) {
  return (
    <div className="space-y-0">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl italic text-daisy-text">frequency</h2>
        <span className="font-mono text-[11px] text-daisy-muted">muscle groups</span>
      </div>
      <Section title="this week" rows={ranked(groups, stats.week)} />
      <Section title="all time" rows={ranked(groups, stats.total)} />
    </div>
  );
}