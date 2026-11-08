"use client";

import { useTranslations } from "next-intl";
import { startTransition, useActionState, useState } from "react";
import { MAX_GUESTS_PER_REGISTRATION } from "@/lib/registration/schema";
import { registerGuest, type RegistrationState } from "./actions";

const input =
  "block w-full min-h-12 rounded-xl border border-[var(--inv-border)] bg-[var(--inv-input-bg)] px-4 py-2.5 text-base text-[var(--inv-fg)] " +
  "placeholder:text-[var(--inv-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--inv-accent)] aria-[invalid=true]:border-red-500";
const label = "block text-sm font-medium";
const errorText = "mt-1 text-sm text-red-600";

export function RegistrationForm({
  slug,
  calendar,
}: {
  slug: string;
  // Shown on the thank-you screen.
  calendar: React.ReactNode;
}) {
  const t = useTranslations("registration");
  const [state, formAction, pending] = useActionState<RegistrationState, FormData>(
    registerGuest.bind(null, slug),
    { status: "idle" },
  );
  const [guestCount, setGuestCount] = useState(1);
  const [editing, setEditing] = useState(false);
  const done = state.status === "success" && !editing;

  const fieldError = (name: string) =>
    state.status === "error" && state.fieldErrors?.[name]
      ? t(`errors.${state.fieldErrors[name]}` as "errors.failed")
      : undefined;
  const a11y = (name: string) => {
    const err = fieldError(name);
    return { "aria-invalid": err ? true : undefined, "aria-describedby": err ? `${name}-error` : undefined } as const;
  };
  const setCount = (n: number) => setGuestCount(Math.min(MAX_GUESTS_PER_REGISTRATION, Math.max(1, n)));

  return (
    <div>
      {done && state.status === "success" && (
        <div role="status" className="space-y-4 text-center">
          <p className="text-4xl" aria-hidden>
            🎉
          </p>
          <h3 className="text-2xl font-bold">{t("thanksTitle", { name: state.fullName })}</h3>
          <p className="text-[var(--inv-muted)]">
            {t(state.result === "updated" ? "thanksUpdated" : "thanksCreated", { count: state.guestCount })}
          </p>
          {calendar}
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm underline underline-offset-4 hover:no-underline"
          >
            {t("editRegistration")}
          </button>
        </div>
      )}

      <form
        hidden={done}
        action={formAction}
        onSubmit={(e) => {
          // Run in a transition instead of the native form action, which
          // would reset every field afterwards.
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          setEditing(false);
          startTransition(() => formAction(formData));
        }}
        noValidate
        className="space-y-5 text-start"
      >
        <h3 className="text-xl font-bold">{t("title")}</h3>

        {state.status === "error" && state.formError && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {t(`errors.${state.formError}` as "errors.failed")}
          </p>
        )}

        {/* Honeypot, hidden from people and assistive tech. */}
        <div aria-hidden className="absolute -start-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <div>
          <label htmlFor="full_name" className={label}>
            {t("fullName")} <span aria-hidden>*</span>
          </label>
          <input id="full_name" name="full_name" autoComplete="name" required maxLength={120} className={`mt-1.5 ${input}`} {...a11y("full_name")} />
          {fieldError("full_name") && <p id="full_name-error" className={errorText}>{fieldError("full_name")}</p>}
        </div>

        <div>
          <label htmlFor="phone" className={label}>
            {t("phone")} <span aria-hidden>*</span>
          </label>
          <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" required placeholder="050-000-0000" className={`mt-1.5 text-start ${input}`} {...a11y("phone")} />
          {fieldError("phone") ? (
            <p id="phone-error" className={errorText}>{fieldError("phone")}</p>
          ) : (
            <p className="mt-1 text-sm text-[var(--inv-muted)]">{t("phoneHint")}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className={label}>
            {t("email")} <span className="font-normal text-[var(--inv-muted)]">({t("optional")})</span>
          </label>
          <input id="email" name="email" type="email" inputMode="email" autoComplete="email" dir="ltr" className={`mt-1.5 text-start ${input}`} {...a11y("email")} />
          {fieldError("email") ? (
            <p id="email-error" className={errorText}>{fieldError("email")}</p>
          ) : (
            <p className="mt-1 text-sm text-[var(--inv-muted)]">{t("emailHint")}</p>
          )}
        </div>

        <div>
          <span id="guest_count-label" className={label}>{t("guestCount")}</span>
          <div className="mt-1.5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCount(guestCount - 1)}
              disabled={guestCount <= 1}
              aria-label={t("decrease")}
              className="size-12 rounded-xl border border-[var(--inv-border)] bg-[var(--inv-input-bg)] text-xl disabled:opacity-40"
            >
              −
            </button>
            <input
              id="guest_count"
              name="guest_count"
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_GUESTS_PER_REGISTRATION}
              value={guestCount}
              onChange={(e) => setCount(Number(e.target.value) || 1)}
              aria-labelledby="guest_count-label"
              className={`w-20 text-center ${input}`}
              {...a11y("guest_count")}
            />
            <button
              type="button"
              onClick={() => setCount(guestCount + 1)}
              disabled={guestCount >= MAX_GUESTS_PER_REGISTRATION}
              aria-label={t("increase")}
              className="size-12 rounded-xl border border-[var(--inv-border)] bg-[var(--inv-input-bg)] text-xl disabled:opacity-40"
            >
              +
            </button>
          </div>
          {fieldError("guest_count") && <p id="guest_count-error" className={errorText}>{fieldError("guest_count")}</p>}
        </div>

        {guestCount > 1 && (
          <fieldset className="space-y-3">
            <legend className={label}>{t("companions")}</legend>
            {Array.from({ length: guestCount - 1 }, (_, i) => (
              <input
                key={i}
                name="companions"
                maxLength={120}
                aria-label={t("companionN", { n: i + 2 })}
                placeholder={t("companionN", { n: i + 2 })}
                className={input}
              />
            ))}
          </fieldset>
        )}

        <div>
          <label htmlFor="notes" className={label}>
            {t("notes")} <span className="font-normal text-[var(--inv-muted)]">({t("optional")})</span>
          </label>
          <textarea id="notes" name="notes" rows={3} maxLength={1000} placeholder={t("notesPlaceholder")} className={`mt-1.5 ${input}`} {...a11y("notes")} />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--inv-accent)] px-6 text-lg font-semibold text-[var(--inv-on-accent)] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--inv-accent)] disabled:opacity-60"
        >
          {pending ? t("submitting") : t("submit")}
        </button>
      </form>
    </div>
  );
}
