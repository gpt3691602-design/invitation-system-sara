import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { RegistrationsPanel, type PanelRow } from "@/components/RegistrationsPanel";
import { buttonClass } from "@/components/ui/Button";
import { formatPhone, phoneDigits } from "@/lib/phone";
import { invitationUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export default async function EventPage({ params }: PageProps<"/admin/events/[id]">) {
  const { id } = await params;
  const t = await getTranslations();
  const format = await getFormatter();
  const supabase = await createClient();

  const [{ data: event }, { data: registrations, error: regError }] = await Promise.all([
    supabase.from("events").select("*").eq("id", id).maybeSingle(),
    supabase.from("registrations").select("*").eq("event_id", id).order("created_at", { ascending: false }),
  ]);
  if (!event) notFound();

  const url = await invitationUrl(event.slug);
  const regs = registrations ?? [];
  const confirmed = regs.filter((r) => r.status === "confirmed");
  const totalGuests = confirmed.reduce((sum, r) => sum + r.guest_count, 0);
  const withEmail = confirmed.filter((r) => r.email).length;
  const cancelled = regs.length - confirmed.length;

  const eventDate = new Date(event.date_time);
  const messageParams = {
    event: event.title,
    date: format.dateTime(eventDate, { weekday: "long", day: "numeric", month: "long" }),
    time: format.dateTime(eventDate, { hour: "2-digit", minute: "2-digit" }),
    link: url,
  };

  const rows: PanelRow[] = regs.map((r) => {
    const msg = { ...messageParams, name: r.full_name.split(" ")[0] };
    const names = Array.isArray(r.guest_names) ? r.guest_names.filter((n): n is string => typeof n === "string") : [];
    return {
      id: r.id,
      fullName: r.full_name,
      phone: formatPhone(r.phone),
      phoneSearch: phoneDigits(r.phone),
      email: r.email,
      guestCount: r.guest_count,
      guestNames: names,
      notes: r.notes,
      status: r.status,
      source: r.source,
      createdAt: format.dateTime(new Date(r.created_at), { dateStyle: "short", timeStyle: "short" }),
      whatsappUrl: `https://wa.me/${phoneDigits(r.phone)}?text=${encodeURIComponent(t("reminder.whatsapp", msg))}`,
      mailtoUrl: r.email
        ? `mailto:${r.email}?subject=${encodeURIComponent(t("reminder.emailSubject", msg))}&body=${encodeURIComponent(t("reminder.emailBody", msg))}`
        : null,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href="/admin" className="text-sm text-gray-600 hover:underline">
            {t("admin.backToEvents")}
          </Link>
          <h1 className="mt-1 text-2xl font-bold">{event.title}</h1>
          <p className="text-gray-600">
            {format.dateTime(eventDate, { dateStyle: "full", timeStyle: "short" })}
            {event.venue_name ? ` · ${event.venue_name}` : ""}
          </p>
        </div>
        <Link href={`/admin/events/${event.id}/edit`} className={buttonClass("secondary")}>
          {t("admin.edit")}
        </Link>
      </div>

      {!event.is_active && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{t("admin.inactiveNotice")}</p>}

      <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
        <h2 className="font-semibold">{t("admin.publicLink")}</h2>
        <p className="text-sm text-gray-600">{t("admin.publicLinkHint")}</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <code dir="ltr" className="block min-w-0 flex-1 truncate rounded-lg bg-gray-100 px-3 py-2.5 text-sm">
            {url}
          </code>
          <CopyLinkButton url={url} />
          <a href={`/preview/${event.id}`} target="_blank" rel="noopener" className={buttonClass("secondary")}>
            {t("admin.openInvitation")}
          </a>
        </div>
      </section>

      <section aria-labelledby="summary-heading" className="space-y-3">
        <h2 id="summary-heading" className="sr-only">{t("summary.title")}</h2>
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label={t("summary.registrations")} value={confirmed.length} />
          <Stat
            label={t("summary.totalGuests")}
            value={event.max_guests ? `${totalGuests} / ${event.max_guests}` : totalGuests}
          />
          <Stat label={t("summary.withEmail")} value={withEmail} />
          <Stat label={t("summary.cancelled")} value={cancelled} />
        </dl>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{t("registrations.title")}</h2>
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/events/${event.id}/registrations/new`} className={buttonClass("primary")}>
              {t("registrations.add")}
            </Link>
            {regs.length > 0 && (
              <a href={`/api/events/${event.id}/export`} className={buttonClass("secondary")}>
                {t("registrations.export")}
              </a>
            )}
          </div>
        </div>
        {regError ? (
          <p role="alert" className="text-red-600">{t("registrations.loadFailed")}</p>
        ) : (
          <RegistrationsPanel eventId={event.id} rows={rows} />
        )}
      </section>

      <details className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
        <summary className="cursor-pointer font-semibold">{t("admin.eventDetails")}</summary>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
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
      </details>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <dt className="text-sm text-gray-600">{label}</dt>
      <dd className="mt-1 text-2xl font-bold tabular-nums">{value}</dd>
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
