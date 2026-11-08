import type { TemplateProps } from "../types";
import { rubik } from "../fonts";

// Business clean: accent header band, content as a two-column sheet.
export function CorporateTemplate({ event, slots }: TemplateProps) {
  return (
    <div className={`${rubik.className} min-h-dvh bg-[var(--inv-bg)] text-[var(--inv-fg)]`}>
      <header className="bg-[var(--inv-accent)] px-4 pt-12 pb-24 text-[var(--inv-on-accent)]">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold opacity-80">✉</p>
          <h1 className="mt-3 max-w-3xl text-4xl leading-tight font-extrabold text-balance sm:text-5xl">{event.title}</h1>
        </div>
      </header>
      <main className="mx-auto -mt-16 max-w-4xl px-4 pb-14">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <section className="space-y-6 rounded-2xl border border-[var(--inv-border)] bg-[var(--inv-surface)] p-6 shadow-sm sm:p-8">
            {slots.media && <div className="overflow-hidden rounded-xl">{slots.media}</div>}
            <div className="text-start">{slots.description}</div>
            <div className="text-start">{slots.info}</div>
            {slots.countdown}
            {slots.actions}
          </section>
          <section className="h-fit rounded-2xl border border-[var(--inv-border)] bg-[var(--inv-surface)] p-6 shadow-sm sm:p-8 lg:sticky lg:top-6">
            {slots.registration}
          </section>
        </div>
      </main>
      {slots.footer}
    </div>
  );
}
