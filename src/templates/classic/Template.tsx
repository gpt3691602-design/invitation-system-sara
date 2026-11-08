import type { TemplateProps } from "../types";
import { frankRuhl } from "../fonts";

// Light and formal: centered paper card, serif titles, thin rules.
export function ClassicTemplate({ event, slots }: TemplateProps) {
  return (
    <div className="min-h-dvh bg-[var(--inv-bg)] px-4 py-8 text-[var(--inv-fg)] sm:py-14">
      <main className="mx-auto max-w-xl"><article className="overflow-hidden rounded-[2rem] border border-[var(--inv-border)] bg-[var(--inv-surface)] shadow-[0_20px_60px_-30px_rgb(0_0_0/0.35)]">
        {slots.media && <div className="border-b border-[var(--inv-border)]">{slots.media}</div>}
        <div className="space-y-8 px-6 py-10 text-center sm:px-10">
          <header className="space-y-4">
            <Rule />
            <h1 className={`${frankRuhl.className} text-4xl leading-tight font-bold text-balance sm:text-5xl`}>{event.title}</h1>
            <Rule />
          </header>
          {slots.description}
          {slots.info}
          {slots.countdown}
          {slots.actions}
          <div className="border-t border-[var(--inv-border)] pt-8">{slots.registration}</div>
        </div>
      </article></main>
      {slots.footer}
    </div>
  );
}

function Rule() {
  return (
    <div className="flex items-center justify-center gap-3" aria-hidden>
      <span className="h-px w-16 bg-[var(--inv-accent)]" />
      <span className="size-1.5 rotate-45 bg-[var(--inv-accent)]" />
      <span className="h-px w-16 bg-[var(--inv-accent)]" />
    </div>
  );
}
