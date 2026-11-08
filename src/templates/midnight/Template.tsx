import type { TemplateProps } from "../types";
import { rubik } from "../fonts";

// Dark and modern: media as a full-width hero, glowing accent, glass panel.
export function MidnightTemplate({ event, slots }: TemplateProps) {
  return (
    <div className={`${rubik.className} min-h-dvh bg-[var(--inv-bg)] text-[var(--inv-fg)]`}>
      <header className="relative isolate overflow-hidden px-4 pt-16 pb-10 text-center">
        <div
          aria-hidden
          className="absolute inset-x-0 -top-40 -z-10 mx-auto h-80 max-w-2xl rounded-full opacity-40 blur-3xl"
          style={{ background: "var(--inv-accent)" }}
        />
        <p aria-hidden className="text-2xl text-[var(--inv-accent)]">✦</p>
        <h1 className="mx-auto mt-4 max-w-2xl text-4xl leading-tight font-extrabold text-balance sm:text-6xl">{event.title}</h1>
      </header>
      <main className="mx-auto max-w-2xl space-y-8 px-4 pb-16">
        {slots.media && <div className="overflow-hidden rounded-3xl border border-[var(--inv-border)]">{slots.media}</div>}
        <section className="space-y-8 rounded-3xl border border-[var(--inv-border)] bg-[var(--inv-surface)] p-6 text-center backdrop-blur sm:p-10">
          {slots.description}
          {slots.info}
          {slots.countdown}
          {slots.actions}
        </section>
        <section className="rounded-3xl border border-[var(--inv-border)] bg-[var(--inv-surface)] p-6 sm:p-10">{slots.registration}</section>
      </main>
      {slots.footer}
    </div>
  );
}
