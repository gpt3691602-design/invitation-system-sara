"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { startTransition, useActionState } from "react";
import type { RegistrationFormState } from "@/app/admin/events/[id]/registrations/actions";
import { Button, buttonClass } from "@/components/ui/Button";
import { Field, describedBy, inputClass } from "@/components/ui/Field";

export type RegistrationDefaults = {
  full_name: string;
  phone: string;
  email: string;
  guest_count: number;
  guest_names: string; // one per line
  notes: string;
  status: "confirmed" | "cancelled";
};

export const emptyRegistration: RegistrationDefaults = {
  full_name: "",
  phone: "",
  email: "",
  guest_count: 1,
  guest_names: "",
  notes: "",
  status: "confirmed",
};

export function RegistrationStaffForm({
  action,
  defaults,
  submitLabel,
  cancelHref,
}: {
  action: (prev: RegistrationFormState, formData: FormData) => Promise<RegistrationFormState>;
  defaults: RegistrationDefaults;
  submitLabel: string;
  cancelHref: string;
}) {
  const t = useTranslations("registrationForm");
  const [state, formAction, pending] = useActionState(action, {});
  const err = (f: string) => (state.fieldErrors?.[f] ? t(`errors.${state.fieldErrors[f]}` as "errors.invalid") : undefined);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => formAction(fd));
      }}
      noValidate
      className="space-y-5"
    >
      {state.formError && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {t(`errors.${state.formError}` as "errors.saveFailed")}
        </p>
      )}
      <Field id="full_name" label={t("fullName")} error={err("full_name")} required>
        <input id="full_name" name="full_name" defaultValue={defaults.full_name} maxLength={120} className={inputClass} {...describedBy("full_name", err("full_name"))} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="phone" label={t("phone")} error={err("phone")} required>
          <input id="phone" name="phone" type="tel" dir="ltr" defaultValue={defaults.phone} className={`${inputClass} text-start`} {...describedBy("phone", err("phone"))} />
        </Field>
        <Field id="email" label={t("email")} error={err("email")}>
          <input id="email" name="email" type="email" dir="ltr" defaultValue={defaults.email} className={`${inputClass} text-start`} {...describedBy("email", err("email"))} />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="guest_count" label={t("guestCount")} error={err("guest_count")} required>
          <input id="guest_count" name="guest_count" type="number" inputMode="numeric" min={1} max={50} defaultValue={defaults.guest_count} className={inputClass} {...describedBy("guest_count", err("guest_count"))} />
        </Field>
        <Field id="status" label={t("status")}>
          <select id="status" name="status" defaultValue={defaults.status} className={inputClass}>
            <option value="confirmed">{t("statuses.confirmed")}</option>
            <option value="cancelled">{t("statuses.cancelled")}</option>
          </select>
        </Field>
      </div>
      <Field id="guest_names" label={t("guestNames")} hint={t("guestNamesHint")} error={err("guest_names")}>
        <textarea id="guest_names" name="guest_names" rows={4} defaultValue={defaults.guest_names} className={inputClass} {...describedBy("guest_names", err("guest_names"), t("guestNamesHint"))} />
      </Field>
      <Field id="notes" label={t("notes")} error={err("notes")}>
        <textarea id="notes" name="notes" rows={3} maxLength={1000} defaultValue={defaults.notes} className={inputClass} {...describedBy("notes", err("notes"))} />
      </Field>
      <div className="flex gap-3 border-t border-gray-200 pt-5">
        <Button type="submit" disabled={pending}>{pending ? t("saving") : submitLabel}</Button>
        <Link href={cancelHref} className={buttonClass("ghost")}>{t("cancel")}</Link>
      </div>
    </form>
  );
}
