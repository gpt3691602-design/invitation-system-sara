import type { TemplateProps } from "../types";
import { frankRuhl } from "../fonts";

// Black-tie: near-black ground, double gold frame, serif capitals.
export function GoldTemplate({ event, slots }: TemplateProps) {
  return (
    <div className="min-h-dvh bg-[var(--inv-bg)] px-3 py-6 text-[var(--inv-fg)] sm:px-6 sm:py-12">
      <main className="mx-auto max-w-xl border border-[var(--inv-accent)] p-1.5">
        <div className="space-y-8 border border-[var(--inv-accent)]/60 px-5 py-10 text-center sm:px-10">
          <Ornament />
          <h1 className={`${frankRuhl.className} text-4xl leading-tight text-balance text-[var(--inv-accent)] sm:text-5xl`}>{event.title}</h1>
          <Ornament />
          {slots.media && <div className="border border-[var(--inv-accent)]/50 p-1">{slots.media}</div>}
          {slots.description}
          {slots.info}
          {slots.countdown}
          {slots.actions}
          <div className="border-t border-[var(--inv-accent)]/40 pt-8">{slots.registration}</div>
        </div>
      </main>
      {slots.footer}
    </div>
  );
}

function Ornament() {
  return (
    <svg viewBox="0 0 160 16" aria-hidden className="mx-auto h-4 w-40 text-[var(--inv-accent)]">
      <path d="M0 8 H62 M98 8 H160" stroke="currentColor" strokeWidth="1" />
      <path d="M80 1 L87 8 L80 15 L73 8 Z" fill="currentColor" />
      <circle cx="66" cy="8" r="2" fill="currentColor" />
      <circle cx="94" cy="8" r="2" fill="currentColor" />
    </svg>
  );
}
