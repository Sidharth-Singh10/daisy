export function BezCard({
  className = "",
  bodyClassName = "",
  children,
}: {
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-[2rem] border border-white/10 bg-white/5 p-1.5 ${className}`}>
      <div
        className={`h-full rounded-[calc(2rem-0.375rem)] bg-daisy-surface ${bodyClassName}`}
        style={{ boxShadow: "inset 0 1px 1px rgba(255,255,255,0.15)" }}
      >
        {children}
      </div>
    </div>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-daisy-muted">
      {children}
    </span>
  );
}