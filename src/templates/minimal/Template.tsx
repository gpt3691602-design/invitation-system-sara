import type { TemplateProps } from "../types";

// Editorial minimalism: oversized type, hairlines, no boxes.
export function MinimalTemplate({ event, slots }: TemplateProps) {
  return (
    <div className="min-h-dvh bg-[var(--inv-bg)] text-[var(--inv-fg)]">
      <main className="mx-auto max-w-2xl px-6 py-14 sm:py-20">
        <h1 className="text-5xl leading-[1.05] font-bold tracking-tight text-balance sm:text-7xl">{event.title}</h1>
        <div className="mt-10 h-px bg-[var(--inv-fg)]" />
        {slots.media && <div className="mt-10">{slots.media}</div>}
        <div className="mt-10 grid gap-10 sm:grid-cols-[1fr_1.4fr]">
          <div className="text-start">{slots.info}</div>
          <div className="space-y-8 text-start">{slots.description}</div>
        </div>
        {slots.countdown && <div className="mt-12">{slots.countdown}</div>}
        <div className="mt-10">{slots.actions}</div>
        <div className="mt-14 border-t border-[var(--inv-fg)] pt-10">{slots.registration}</div>
      </main>
      {slots.footer}
    </div>
  );
}
