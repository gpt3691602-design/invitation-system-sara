import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { buttonClass } from "@/components/ui/Button";
import { invitationUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

// Stage 1: event summary and the shareable link. Stage 3 adds the
// registrations table, totals and per-guest actions here.
export default async function EventPage({ params }: PageProps<"/admin/events/[id]">) {
  const { id } = await params;
  const t = await getTranslations();
  const format = await getFormatter();
  const supabase = await createClient();
  const { data: event } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (!event) notFound();

  const url = await invitationUrl(event.slug);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href="/admin" className="text-sm text-gray-600 hover:underline">
            {t("admin.backToEvents")}
          </Link>
          <h1 className="mt-1 text-2xl font-bold">{event.title}</h1>
          <p className="text-gray-600">
            {format.dateTime(new Date(event.date_time), { dateStyle: "full", timeStyle: "short" })}
            {event.venue_name ? ` · ${event.venue_name}` : ""}
          </p>
        </div>
        <Link href={`/admin/events/${event.id}/edit`} className={buttonClass("secondary")}>
          {t("admin.edit")}
        </Link>
      </div>

      {!event.is_active && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{t("admin.inactiveNotice")}</p>
      )}

      <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
        <h2 className="font-semibold">{t("admin.publicLink")}</h2>
        <p className="text-sm text-gray-600">{t("admin.publicLinkHint")}</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <code dir="ltr" className="block min-w-0 flex-1 truncate rounded-lg bg-gray-100 px-3 py-2.5 text-sm">
            {url}
          </code>
          <CopyLinkButton url={url} />
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Detail label={t("eventForm.eventType")} value={t(`admin.eventTypes.${event.event_type}`)} />
          <Detail label={t("templates.legend")} value={t(`templates.${event.template_id as "classic"}`)} />
          <Detail label={t("eventForm.address")} value={event.address} />
          <Detail
            label={t("eventForm.rsvpDeadline")}
            value={event.rsvp_deadline ? format.dateTime(new Date(event.rsvp_deadline), { dateStyle: "medium", timeStyle: "short" }) : null}
          />
          <Detail label={t("eventForm.maxGuests")} value={event.max_guests?.toString()} />
          <Detail label={t("eventForm.giftLink")} value={event.gift_link_url} ltr />
        </dl>
      </section>
    </div>
  );
}

function Detail({ label, value, ltr }: { label: string; value: string | null | undefined; ltr?: boolean }) {
  return (
    <div>
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="mt-0.5 break-words" dir={ltr ? "ltr" : undefined}>{value || "—"}</dd>
    </div>
  );
}
