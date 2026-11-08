import type { TemplateProps } from "../types";
import { amatic, frankRuhl } from "../fonts";

// Romantic: handwritten title, arched photo, hearts.
export function RomanticTemplate({ event, slots }: TemplateProps) {
  return (
    <div className="min-h-dvh bg-[var(--inv-bg)] px-4 py-10 text-[var(--inv-fg)] sm:py-16">
      <main className="mx-auto max-w-xl space-y-8 text-center">
        <p aria-hidden className="text-2xl text-[var(--inv-accent)]">♡</p>
        <h1 className={`${amatic.className} text-6xl leading-none font-bold text-balance sm:text-7xl`}>{event.title}</h1>
        {slots.media && (
          <div className="mx-auto max-w-sm overflow-hidden rounded-t-[999px] rounded-b-3xl border-[6px] border-[var(--inv-surface)] shadow-xl">{slots.media}</div>
        )}
        <section className={`${frankRuhl.className} space-y-8`}>
          {slots.description}
          <div className="mx-auto h-px w-24 bg-[var(--inv-accent)]" />
          {slots.info}
        </section>
        {slots.countdown}
        {slots.actions}
        <section className="rounded-3xl bg-[var(--inv-surface)] p-6 shadow-sm sm:p-8">{slots.registration}</section>
      </main>
      {slots.footer}
    </div>
  );
}
