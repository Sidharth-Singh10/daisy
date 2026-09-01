export function DaisyMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  const petals = Array.from({ length: 8 }, (_, i) => ({
    key: i,
    rotate: i * 45,
    opacity: i % 2 === 0 ? 0.92 : 0.78,
  }));
  return (
    <svg
      viewBox="0 0 96 96"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      {petals.map((p) => (
        <ellipse
          key={p.key}
          cx="48"
          cy="30"
          rx="8.5"
          ry="19"
          fill="#f4f7f4"
          opacity={p.opacity}
          transform={`rotate(${p.rotate} 48 48)`}
        />
      ))}
      <circle cx="48" cy="48" r="13" fill="#c9a227" />
      <circle cx="48" cy="48" r="13" fill="none" stroke="#7a5a18" strokeWidth="2" />
      <path d="M48 61c0 7-5.5 9.5-5.5 15" stroke="#3fa656" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M42.5 69c-5 1.5-7 4.5-7 8" stroke="#3fa656" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M53.5 69c5 1.5 7 4.5 7 8" stroke="#3fa656" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function DaisyLogo({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <DaisyMark size={size} />
      <span className="font-display text-xl italic leading-none text-daisy-text">daisy</span>
    </span>
  );
}