import type { TemplateProps } from "../types";
import { secularOne } from "../fonts";

// Party: striped banner, bold display type, balloons.
export function FestiveTemplate({ event, slots }: TemplateProps) {
  return (
    <div className="min-h-dvh bg-[var(--inv-bg)] text-[var(--inv-fg)]">
      <div
        aria-hidden
        className="h-4"
        style={{ backgroundImage: "repeating-linear-gradient(135deg, var(--inv-accent) 0 16px, transparent 16px 32px)" }}
      />
      <main className="mx-auto max-w-xl space-y-8 px-4 py-10 text-center">
        <Balloons />
        <h1 className={`${secularOne.className} text-5xl leading-tight text-balance text-[var(--inv-accent)] sm:text-6xl`}>{event.title}</h1>
        {slots.media && <div className="overflow-hidden rounded-3xl shadow-xl ring-4 ring-[var(--inv-accent)]">{slots.media}</div>}
        <section className="space-y-8 rounded-3xl bg-[var(--inv-surface)] p-6 shadow-md sm:p-8">
          {slots.description}
          {slots.info}
          {slots.countdown}
          {slots.actions}
        </section>
        <section className="rounded-3xl bg-[var(--inv-surface)] p-6 shadow-md sm:p-8">{slots.registration}</section>
      </main>
      {slots.footer}
    </div>
  );
}

function Balloons() {
  const colors = ["var(--inv-accent)", "#f59e0b", "#3b82f6"];
  return (
    <svg viewBox="0 0 120 70" aria-hidden className="mx-auto h-20 w-32">
      {colors.map((c, i) => (
        <g key={i} transform={`translate(${20 + i * 40} ${i === 1 ? 4 : 12})`}>
          <ellipse cx="0" cy="18" rx="14" ry="18" fill={c} />
          <path d={`M0 36 q4 10 -2 20`} stroke="currentColor" strokeOpacity="0.4" fill="none" />
        </g>
      ))}
    </svg>
  );
}
