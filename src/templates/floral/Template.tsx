import type { TemplateProps } from "../types";
import { frankRuhl } from "../fonts";

// Soft blush paper with hand-drawn leaf sprigs in the corners.
export function FloralTemplate({ event, slots }: TemplateProps) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-[var(--inv-bg)] px-4 py-10 text-[var(--inv-fg)] sm:py-16">
      <Sprig className="absolute -top-4 -start-4 size-24 sm:-top-6 sm:-start-6 sm:size-64" />
      <Sprig className="absolute -end-4 -bottom-4 size-24 rotate-180 sm:-end-6 sm:-bottom-6 sm:size-64" />
      <main className="relative mx-auto max-w-xl space-y-8 text-center">
        <p className={`${frankRuhl.className} text-lg text-[var(--inv-accent)]`}>❀</p>
        <h1 className={`${frankRuhl.className} text-4xl leading-tight text-balance sm:text-5xl`}>{event.title}</h1>
        {slots.media && <div className="mx-auto max-w-md overflow-hidden rounded-t-full border-4 border-white shadow-lg">{slots.media}</div>}
        <section className="space-y-8 rounded-[2.5rem] bg-[var(--inv-surface)]/90 p-6 shadow-sm sm:p-10">
          {slots.description}
          {slots.info}
          {slots.countdown}
          {slots.actions}
        </section>
        <section className="rounded-[2.5rem] bg-[var(--inv-surface)]/90 p-6 shadow-sm sm:p-10">{slots.registration}</section>
      </main>
      {slots.footer}
    </div>
  );
}

function Sprig({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 200 200" aria-hidden className={`pointer-events-none text-[var(--inv-accent)] opacity-40 ${className}`} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 190 C60 140 110 100 190 10" />
      {[30, 60, 90, 120, 150].map((t, i) => (
        <g key={t}>
          <ellipse cx={20 + t * 0.9} cy={180 - t * 0.95} rx="16" ry="7" transform={`rotate(${-50 + i * 4} ${20 + t * 0.9} ${180 - t * 0.95}) translate(12 -10)`} fill="currentColor" fillOpacity="0.25" />
          <ellipse cx={20 + t * 0.9} cy={180 - t * 0.95} rx="16" ry="7" transform={`rotate(${40 - i * 4} ${20 + t * 0.9} ${180 - t * 0.95}) translate(-12 10)`} fill="currentColor" fillOpacity="0.25" />
        </g>
      ))}
      <circle cx="186" cy="14" r="8" fill="currentColor" fillOpacity="0.5" />
    </svg>
  );
}
