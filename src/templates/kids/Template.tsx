import type { TemplateProps } from "../types";
import { varelaRound } from "../fonts";

// Playful: rounded everything, confetti dots, tilted photo.
export function KidsTemplate({ event, slots }: TemplateProps) {
  return (
    <div className={`${varelaRound.className} relative min-h-dvh overflow-hidden bg-[var(--inv-bg)] px-4 py-10 text-[var(--inv-fg)]`}>
      <Confetti />
      <main className="relative mx-auto max-w-xl space-y-8 text-center">
        <h1 className="text-4xl leading-tight text-balance sm:text-5xl">
          <span className="inline-block -rotate-2 rounded-3xl bg-[var(--inv-accent)] px-5 py-3 text-[var(--inv-on-accent)] shadow-lg">{event.title}</span>
        </h1>
        {slots.media && (
          <div className="mx-auto max-w-md rotate-1 overflow-hidden rounded-[2rem] border-8 border-white shadow-xl">{slots.media}</div>
        )}
        <section className="space-y-8 rounded-[2rem] bg-[var(--inv-surface)] p-6 shadow-sm sm:p-8">
          {slots.description}
          {slots.info}
          {slots.countdown}
          {slots.actions}
        </section>
        <section className="rounded-[2rem] bg-[var(--inv-surface)] p-6 shadow-sm sm:p-8">{slots.registration}</section>
      </main>
      {slots.footer}
    </div>
  );
}

const DOTS = [
  { top: "6%", left: "8%", size: 14, color: "#f97316" },
  { top: "12%", left: "86%", size: 18, color: "#22c55e" },
  { top: "30%", left: "4%", size: 10, color: "#3b82f6" },
  { top: "44%", left: "92%", size: 12, color: "#ec4899" },
  { top: "68%", left: "6%", size: 16, color: "#eab308" },
  { top: "82%", left: "88%", size: 10, color: "#8b5cf6" },
];

function Confetti() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {DOTS.map((d, i) => (
        <span key={i} className="absolute rounded-full opacity-70" style={{ top: d.top, left: d.left, width: d.size, height: d.size, background: d.color }} />
      ))}
    </div>
  );
}
