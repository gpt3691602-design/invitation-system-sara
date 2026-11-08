"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
}

// Rendered only after mount: the server's clock and the guest's clock differ,
// and a server-rendered number would flash and mismatch on hydration.
export function Countdown({ target }: { target: string }) {
  const t = useTranslations("invite.countdown");
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- start the clock on mount only
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = now === null ? null : new Date(target).getTime() - now;
  if (remaining !== null && remaining <= 0) return null;
  const p = remaining === null ? null : parts(remaining);

  return (
    <div className="flex justify-center gap-3 sm:gap-4" aria-label={t("label")}>
      {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
        <div key={unit} className="min-w-16 rounded-xl border border-[var(--inv-border)] bg-[var(--inv-surface)] px-2 py-3 text-center">
          <div className="text-2xl font-bold tabular-nums sm:text-3xl" aria-hidden={p === null}>
            {p === null ? "–" : p[unit]}
          </div>
          <div className="text-xs text-[var(--inv-muted)]">{t(unit)}</div>
        </div>
      ))}
    </div>
  );
}
