import type { TemplateProps } from "../types";
import { rubik } from "../fonts";

// Tech: dark grid canvas, mono labels, neon accent edges.
export function TechTemplate({ event, slots }: TemplateProps) {
  return (
    <div
      className={`${rubik.className} min-h-dvh bg-[var(--inv-bg)] text-[var(--inv-fg)]`}
      style={{
        backgroundImage:
          "linear-gradient(rgb(255 255 255 / 0.04) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.04) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    >
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-14">
        <header className="space-y-4">
          <p dir="ltr" aria-hidden className="font-mono text-sm text-[var(--inv-accent)]">&gt; event.init()</p>
          <h1 className="text-4xl leading-tight font-extrabold text-balance sm:text-6xl">{event.title}</h1>
          <div className="h-1 w-24 rounded-full bg-[var(--inv-accent)] shadow-[0_0_24px_var(--inv-accent)]" />
        </header>
        {slots.media && <div className="overflow-hidden rounded-2xl border border-[var(--inv-accent)]/40">{slots.media}</div>}
        <section className="space-y-8 rounded-2xl border border-[var(--inv-border)] bg-[var(--inv-surface)] p-6 sm:p-8">
          <div className="text-start">{slots.description}</div>
          <div className="text-start">{slots.info}</div>
          {slots.countdown}
          {slots.actions}
        </section>
        <section className="rounded-2xl border border-[var(--inv-accent)]/40 bg-[var(--inv-surface)] p-6 sm:p-8">{slots.registration}</section>
      </main>
      {slots.footer}
    </div>
  );
}
