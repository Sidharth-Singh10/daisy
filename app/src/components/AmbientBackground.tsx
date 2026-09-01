const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")";

export function AmbientBackground() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div
          className="absolute -top-40 -left-40 h-[42rem] w-[42rem] rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, #3fa656 0%, transparent 65%)" }}
        />
        <div
          className="absolute -right-48 -bottom-56 h-[46rem] w-[46rem] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, #c9a227 0%, transparent 65%)" }}
        />
        <div
          className="absolute top-1/3 right-1/4 h-[24rem] w-[24rem] rounded-full opacity-[0.03]"
          style={{ background: "radial-gradient(circle, #56c47a 0%, transparent 60%)" }}
        />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[60] opacity-[0.025]"
        style={{ backgroundImage: NOISE, backgroundSize: "120px 120px" }}
      />
    </>
  );
}