import { getFormatter, getTranslations } from "next-intl/server";
import type { PublicEvent } from "@/lib/public-event";

export async function EventInfo({ event }: { event: PublicEvent }) {
  const format = await getFormatter();
  const t = await getTranslations("invite");
  const date = new Date(event.date_time);

  return (
    <dl className="space-y-3">
      <div>
        <dt className="sr-only">{t("when")}</dt>
        <dd className="text-lg font-semibold">{format.dateTime(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</dd>
        <dd className="text-[var(--inv-muted)]">{t("atTime", { time: format.dateTime(date, { hour: "2-digit", minute: "2-digit" }) })}</dd>
      </div>
      {(event.venue_name || event.address) && (
        <div>
          <dt className="sr-only">{t("where")}</dt>
          {event.venue_name && <dd className="text-lg font-semibold">{event.venue_name}</dd>}
          {event.address && <dd className="text-[var(--inv-muted)]">{event.address}</dd>}
        </div>
      )}
    </dl>
  );
}
