"use client";

import { useTranslations } from "next-intl";
import { startTransition, useActionState, useRef, useState } from "react";
import { findTable, type FindTableState } from "./actions";

// Event-day card: one phone field, one big button, one big answer.
export function FindTable({ slug, open }: { slug: string; open: boolean }) {
  const t = useTranslations("invite.findTable");
  const [state, action, pending] = useActionState<FindTableState, FormData>(findTable.bind(null, slug), { status: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);
  // "Search another number" hides the last answer without sending anything.
  const [cleared, setCleared] = useState(false);
  const found = state.status === "found" && !cleared;

  return (
    <section
      aria-labelledby="find-table-title"
      className="rounded-3xl border-2 border-[var(--inv-accent)] bg-[var(--inv-surface)] p-6 text-center shadow-[0_10px_40px_-15px_var(--inv-accent)] sm:p-8"
    >
      <h2 id="find-table-title" className="text-2xl font-bold sm:text-3xl">
        <span aria-hidden>🪑 </span>
        {t("title")}
      </h2>

      <div aria-live="polite">
        {found ? (
          <div className="mt-5 space-y-3">
            <p className="text-[var(--inv-muted)]">{t("yourTable")}</p>
            <p className="text-5xl leading-tight font-extrabold text-[var(--inv-accent)] sm:text-6xl">{state.tableName}</p>
            <p className="text-lg">{t("seats", { count: state.guestCount })}</p>
            <p className="text-lg font-semibold">{t("enjoy")} 🎉</p>
            <button
              type="button"
              onClick={() => {
                setCleared(true);
                setTimeout(() => inputRef.current?.focus(), 0);
              }}
              className="mt-2 text-sm underline underline-offset-4"
            >
              {t("again")}
            </button>
          </div>
        ) : (
          state.status !== "idle" && state.status !== "found" && !cleared && (
            <p role="alert" className="mx-auto mt-4 max-w-md rounded-2xl bg-[var(--inv-input-bg)] p-4 text-base leading-relaxed">
              {t(state.status)}
            </p>
          )
        )}
      </div>

      {!open && <p className="mx-auto mt-4 max-w-sm text-lg text-[var(--inv-muted)]">{t("opensOnDay")}</p>}

      {open && !found && (
        <form
          action={action}
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            setCleared(false);
            startTransition(() => action(fd));
          }}
          className="mx-auto mt-5 max-w-sm space-y-3"
        >
          <p className="text-[var(--inv-muted)]">{t("subtitle")}</p>
          <label htmlFor="find-table-phone" className="sr-only">
            {t("phone")}
          </label>
          <input
            ref={inputRef}
            id="find-table-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            required
            placeholder="050-000-0000"
            className="block min-h-14 w-full rounded-2xl border border-[var(--inv-border)] bg-[var(--inv-input-bg)] px-4 text-center text-2xl tracking-wide text-[var(--inv-fg)] placeholder:text-[var(--inv-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--inv-accent)]"
          />
          <button
            type="submit"
            disabled={pending}
            className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-[var(--inv-accent)] px-6 text-xl font-bold text-[var(--inv-on-accent)] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--inv-accent)] disabled:opacity-60"
          >
            {pending ? t("searching") : t("submit")}
          </button>
        </form>
      )}
    </section>
  );
}
