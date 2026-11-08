"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { signIn, type LoginState } from "./actions";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";

export function LoginForm({ next }: { next: string }) {
  const t = useTranslations("login");
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {});

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field id="email" label={t("email")} required>
        <input id="email" name="email" type="email" autoComplete="username" dir="ltr" required defaultValue={state.email} className={inputClass} />
      </Field>
      <Field id="password" label={t("password")} required>
        <input id="password" name="password" type="password" autoComplete="current-password" dir="ltr" required className={inputClass} />
      </Field>
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {t(`errors.${state.error}`)}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? t("signingIn") : t("submit")}
      </Button>
    </form>
  );
}
