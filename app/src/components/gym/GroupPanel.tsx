"use client";

import { motion } from "framer-motion";
import { Check, PencilSimple, Plus, Trash, X } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

import type { GymCount, GymGroup } from "@/lib/types";
import { groupColor } from "@/components/gym/colors";

const EASE = [0.32, 0.72, 0, 1] as const;

function GroupForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: GymGroup | null;
  onSubmit: (name: string) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-3">
      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) onSubmit(name.trim());
          }}
          placeholder={initial ? "rename group" : "new muscle group"}
          autoFocus={!!initial}
          className="w-full flex-1 rounded-full border border-white/10 bg-daisy-raised px-4 py-2.5 text-sm text-daisy-text placeholder:text-daisy-muted/50 focus:border-daisy-green/50 focus:outline-none"
          style={{ boxShadow: "inset 0 1px 1px rgba(255,255,255,0.12)" }}
        />
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          transition={{ duration: 0.3, ease: EASE }}
          onClick={() => name.trim() && onSubmit(name.trim())}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-daisy-green text-daisy-bg"
          aria-label="save group"
        >
          {initial ? <Check size={15} weight="bold" /> : <Plus size={15} weight="bold" />}
        </motion.button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            aria-label="cancel edit"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-daisy-muted hover:text-daisy-text"
          >
            <X size={14} weight="light" />
          </button>
        )}
      </div>
    </div>
  );
}

export function GroupPanel({
  groups,
  stats,
  onAdd,
  onPatch,
  onDelete,
}: {
  groups: GymGroup[];
  stats: { total: GymCount[]; week: GymCount[] };
  onAdd: (name: string) => Promise<void>;
  onPatch: (id: number, body: { name?: string; position?: number }) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [armed, setArmed] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const totalById = new Map(stats.total.map((c) => [c.group_id, c.count]));
  const weekById = new Map(stats.week.map((c) => [c.group_id, c.count]));

  const armDelete = (id: number) => {
    if (armed === id) {
      setArmed(null);
      void onDelete(id);
      return;
    }
    setArmed(id);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setArmed(null), 3000);
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl italic text-daisy-text">muscle groups</h2>
        <span className="font-mono text-[11px] text-daisy-muted">{groups.length} tracked</span>
      </div>

      {!showForm && (
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.3, ease: EASE }}
          onClick={() => setShowForm(true)}
          className="group flex w-full items-center gap-2 rounded-full border border-dashed border-white/15 px-5 py-3 font-mono text-xs text-daisy-muted transition-colors duration-500 hover:border-daisy-green/50 hover:text-daisy-greenhi"
          style={{ transitionTimingFunction: "cubic-bezier(0.32,0.72,0,1)" }}
        >
          add a muscle group
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-daisy-greenhi transition-transform duration-700 group-hover:rotate-90">
            <Plus size={12} weight="light" />
          </span>
        </motion.button>
      )}
      {showForm && (
        <GroupForm
          onSubmit={(name) => {
            setShowForm(false);
            void onAdd(name);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <ul className="space-y-1.5">
        {groups.map((g) => (
          <li key={g.id} className="rounded-[1.35rem] border border-white/10 bg-white/5 p-1.5">
            <div className="flex items-center gap-2 rounded-[calc(1.35rem-0.25rem)] bg-daisy-raised/50 px-3 py-2.5">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: groupColor(g.id) }}
              />
              {editing === g.id ? (
                <div className="flex-1">
                  <GroupForm
                    initial={g}
                    onCancel={() => setEditing(null)}
                    onSubmit={(name) => {
                      setEditing(null);
                      void onPatch(g.id, { name });
                    }}
                  />
                </div>
              ) : (
                <>
                  <span className="flex-1 truncate text-sm text-daisy-text">{g.name}</span>
                  <span className="hidden shrink-0 items-center gap-1.5 sm:flex">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-daisy-muted">
                      {(totalById.get(g.id) ?? 0).toString().padStart(2, "0")} total
                    </span>
                    <span className="rounded-full border border-daisy-yellow/25 bg-daisy-yellow/5 px-2.5 py-1 font-mono text-[10px] text-daisy-yellow">
                      {(weekById.get(g.id) ?? 0).toString().padStart(2, "0")} wk
                    </span>
                  </span>
                  <button
                    type="button"
                    aria-label="edit group"
                    onClick={() => setEditing(g.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-daisy-muted transition-colors duration-300 hover:bg-white/5 hover:text-daisy-text"
                  >
                    <PencilSimple size={13} weight="light" />
                  </button>
                  <button
                    type="button"
                    aria-label="delete group"
                    onClick={() => armDelete(g.id)}
                    className={`flex h-8 items-center justify-center gap-1 rounded-full px-2 font-mono text-[10px] transition-colors duration-300 ${
                      armed === g.id
                        ? "bg-daisy-danger/15 text-daisy-danger"
                        : "w-8 text-daisy-muted hover:bg-white/5 hover:text-daisy-danger"
                    }`}
                  >
                    {armed === g.id ? (
                      <>
                        <Trash size={11} weight="light" /> sure? history dies too
                      </>
                    ) : (
                      <Trash size={13} weight="light" />
                    )}
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}