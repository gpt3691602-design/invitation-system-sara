import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { buttonClass } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const t = await getTranslations("admin");
  const format = await getFormatter();
  const supabase = await createClient();
  const { data: events, error } = await supabase
    .from("events")
    .select("id, title, date_time, event_type, is_active, venue_name")
    .order("date_time", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Link href="/admin/events/new" className={buttonClass("primary")}>
          {t("newEvent")}
        </Link>
      </div>

      {error && <p role="alert" className="text-red-600">{t("loadFailed")}</p>}

      {events && events.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="text-gray-600">{t("empty")}</p>
        </div>
      )}

      {events && events.length > 0 && (
        <ul className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {events.map((e) => (
            <li key={e.id}>
              <Link href={`/admin/events/${e.id}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-4 hover:bg-gray-50">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{e.title}</span>
                  <span className="block text-sm text-gray-600">
                    {format.dateTime(new Date(e.date_time), { dateStyle: "full", timeStyle: "short" })}
                    {e.venue_name ? ` · ${e.venue_name}` : ""}
                  </span>
                </span>
                <span className="flex gap-2 text-xs">
                  <span className="rounded-full bg-gray-100 px-2 py-1">{t(`eventTypes.${e.event_type}`)}</span>
                  {!e.is_active && <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-800">{t("inactive")}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
