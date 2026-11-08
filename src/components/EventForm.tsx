"use client";

import { useTranslations } from "next-intl";
import { startTransition, useActionState, useState } from "react";
import type { EventFormState } from "@/app/admin/events/actions";
import { geocodeAddress } from "@/app/admin/events/actions";
import { Button } from "@/components/ui/Button";
import { Field, describedBy, inputClass } from "@/components/ui/Field";
import { MediaUpload } from "@/components/MediaUpload";
import { TemplatePicker } from "@/components/TemplatePicker";
import { defaultTemplateId, isTemplateId, templates, type TemplateId } from "@/templates/registry";

export type EventFormDefaults = {
  title: string;
  event_type: "private" | "business";
  description: string;
  date_time: string; // datetime-local value, Israel time
  venue_name: string;
  address: string;
  lat: string;
  lng: string;
  template_id: string;
  media_url: string | null;
  primary_color: string | null;
  gift_link_url: string;
  rsvp_deadline: string;
  max_guests: string;
  is_active: boolean;
};

export const emptyEventDefaults: EventFormDefaults = {
  title: "",
  event_type: "private",
  description: "",
  date_time: "",
  venue_name: "",
  address: "",
  lat: "",
  lng: "",
  template_id: defaultTemplateId,
  media_url: null,
  primary_color: null,
  gift_link_url: "",
  rsvp_deadline: "",
  max_guests: "",
  is_active: true,
};

type Action = (prev: EventFormState, formData: FormData) => Promise<EventFormState>;

export function EventForm({
  action,
  defaults,
  submitLabel,
}: {
  action: Action;
  defaults: EventFormDefaults;
  submitLabel: string;
}) {
  const t = useTranslations("eventForm");
  const [state, formAction, pending] = useActionState(action, {});
  const [templateId, setTemplateId] = useState<TemplateId>(
    isTemplateId(defaults.template_id) ? defaults.template_id : defaultTemplateId,
  );
  const [address, setAddress] = useState(defaults.address);
  const [lat, setLat] = useState(defaults.lat);
  const [lng, setLng] = useState(defaults.lng);
  const [geo, setGeo] = useState<{ kind: "idle" | "busy" | "ok" | "error"; text?: string }>({ kind: "idle" });
  const [customColor, setCustomColor] = useState(Boolean(defaults.primary_color));
  const templateAccent = templates.find((tpl) => tpl.id === templateId)?.palette.accent ?? "#000000";
  const [color, setColor] = useState(defaults.primary_color ?? templateAccent);

  const err = (field: string) => {
    const key = state.fieldErrors?.[field];
    return key ? t(`errors.${key}` as "errors.invalid") : undefined;
  };

  async function findLocation() {
    setGeo({ kind: "busy" });
    const res = await geocodeAddress(address);
    if (res.ok) {
      setLat(String(res.lat));
      setLng(String(res.lng));
      setGeo({ kind: "ok", text: t("geo.found", { label: res.label }) });
    } else {
      setGeo({ kind: "error", text: t(`geo.${res.error}`) });
    }
  }

  return (
    <form
      // action= keeps the form working before hydration (a plain POST to the
      // server action). Once hydrated, onSubmit takes over and runs the action
      // in a transition instead, because a form action resets every field
      // afterwards and would wipe the user's input on a validation error.
      action={formAction}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => formAction(formData));
      }}
      className="space-y-8"
      noValidate
    >
      {state.formError && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {t(`errors.${state.formError}` as "errors.saveFailed")}
        </p>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t("sections.details")}</h2>
        <Field id="title" label={t("title")} error={err("title")} required>
          <input id="title" name="title" defaultValue={defaults.title} required maxLength={200} className={inputClass} {...describedBy("title", err("title"))} />
        </Field>

        <fieldset className="space-y-1.5">
          <legend className="text-sm font-medium text-gray-900">{t("eventType")}</legend>
          <div className="flex gap-6">
            {(["private", "business"] as const).map((type) => (
              <label key={type} className="flex min-h-11 items-center gap-2">
                <input type="radio" name="event_type" value={type} defaultChecked={defaults.event_type === type} className="size-4" />
                {t(`eventTypes.${type}`)}
              </label>
            ))}
          </div>
        </fieldset>

        <Field id="description" label={t("description")} error={err("description")}>
          <textarea id="description" name="description" rows={4} defaultValue={defaults.description} maxLength={5000} className={inputClass} {...describedBy("description", err("description"))} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="date_time" label={t("dateTime")} hint={t("israelTime")} error={err("date_time")} required>
            <input id="date_time" name="date_time" type="datetime-local" defaultValue={defaults.date_time} required className={inputClass} {...describedBy("date_time", err("date_time"), t("israelTime"))} />
          </Field>
          <Field id="rsvp_deadline" label={t("rsvpDeadline")} hint={t("optional")} error={err("rsvp_deadline")}>
            <input id="rsvp_deadline" name="rsvp_deadline" type="datetime-local" defaultValue={defaults.rsvp_deadline} className={inputClass} {...describedBy("rsvp_deadline", err("rsvp_deadline"), t("optional"))} />
          </Field>
        </div>

        <Field id="max_guests" label={t("maxGuests")} hint={t("maxGuestsHint")} error={err("max_guests")}>
          <input id="max_guests" name="max_guests" type="number" inputMode="numeric" min={1} defaultValue={defaults.max_guests} className={`${inputClass} sm:max-w-48`} {...describedBy("max_guests", err("max_guests"), t("maxGuestsHint"))} />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t("sections.location")}</h2>
        <Field id="venue_name" label={t("venueName")} error={err("venue_name")}>
          <input id="venue_name" name="venue_name" defaultValue={defaults.venue_name} maxLength={200} className={inputClass} {...describedBy("venue_name", err("venue_name"))} />
        </Field>
        <Field id="address" label={t("address")} error={err("address")}>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="address"
              name="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              maxLength={300}
              className={inputClass}
              {...describedBy("address", err("address"))}
            />
            <Button type="button" variant="secondary" className="shrink-0" disabled={address.trim().length < 3 || geo.kind === "busy"} onClick={findLocation}>
              {geo.kind === "busy" ? t("geo.searching") : t("geo.find")}
            </Button>
          </div>
        </Field>
        {geo.text && (
          <p role="status" className={`text-sm ${geo.kind === "error" ? "text-red-600" : "text-gray-600"}`}>
            {geo.text}
          </p>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Field id="lat" label={t("lat")} error={err("lat")}>
            <input id="lat" name="lat" inputMode="decimal" dir="ltr" value={lat} onChange={(e) => setLat(e.target.value)} className={inputClass} {...describedBy("lat", err("lat"))} />
          </Field>
          <Field id="lng" label={t("lng")} error={err("lng")}>
            <input id="lng" name="lng" inputMode="decimal" dir="ltr" value={lng} onChange={(e) => setLng(e.target.value)} className={inputClass} {...describedBy("lng", err("lng"))} />
          </Field>
        </div>
        <p className="text-sm text-gray-500">{t("coordsHint")}</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t("sections.design")}</h2>
        <TemplatePicker value={templateId} onChange={setTemplateId} />
        <MediaUpload initialUrl={defaults.media_url} />
        {err("media_url") && <p className="text-sm text-red-600" role="alert">{err("media_url")}</p>}
        <div className="space-y-2">
          <label className="flex min-h-11 items-center gap-2">
            <input type="checkbox" name="use_custom_color" checked={customColor} onChange={(e) => setCustomColor(e.target.checked)} className="size-4" />
            {t("customColor")}
          </label>
          <input type="hidden" name="primary_color" value={customColor ? color : ""} />
          {customColor && (
            <label className="flex items-center gap-3">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-11 w-16 cursor-pointer rounded border border-gray-300" aria-label={t("pickColor")} />
              <span dir="ltr" className="font-mono text-sm">{color}</span>
            </label>
          )}
          {err("primary_color") && <p className="text-sm text-red-600" role="alert">{err("primary_color")}</p>}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">{t("sections.more")}</h2>
        <Field id="gift_link_url" label={t("giftLink")} hint={t("giftLinkHint")} error={err("gift_link_url")}>
          <input id="gift_link_url" name="gift_link_url" type="url" dir="ltr" inputMode="url" placeholder="https://" defaultValue={defaults.gift_link_url} className={inputClass} {...describedBy("gift_link_url", err("gift_link_url"), t("giftLinkHint"))} />
        </Field>
        <label className="flex min-h-11 items-center gap-2">
          <input type="checkbox" name="is_active" defaultChecked={defaults.is_active} className="size-4" />
          {t("isActive")}
        </label>
      </section>

      <div className="flex gap-3 border-t border-gray-200 pt-6">
        <Button type="submit" disabled={pending}>
          {pending ? t("saving") : submitLabel}
        </Button>
      </div>
    </form>
  );
}
