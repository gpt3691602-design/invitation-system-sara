import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { SeatingBoard, type SeatingGuest } from "@/components/SeatingBoard";
import { createClient } from "@/lib/supabase/server";

export default async function TablesPage({ params }: PageProps<"/admin/events/[id]/tables">) {
  const { id } = await params;
  const t = await getTranslations("seating");
  const supabase = await createClient();

  const [{ data: event }, { data: tables }, { data: regs }, { data: links }] = await Promise.all([
    supabase.from("events").select("id, title").eq("id", id).maybeSingle(),
    supabase.from("tables").select("id, name, capacity").eq("event_id", id).order("sort_order"),
    supabase.from("registrations").select("id, full_name, guest_count, guest_names").eq("event_id", id).eq("status", "confirmed").order("full_name"),
    supabase.from("registration_tables").select("registration_id, table_id").eq("event_id", id),
  ]);
  if (!event) notFound();

  const tableOf = new Map((links ?? []).map((l) => [l.registration_id, l.table_id]));
  const guests: SeatingGuest[] = (regs ?? []).map((r) => ({
    id: r.id,
    fullName: r.full_name,
    guestCount: r.guest_count,
    names: Array.isArray(r.guest_names) ? r.guest_names.filter((n): n is string => typeof n === "string") : [],
    tableId: tableOf.get(r.id) ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/admin/events/${event.id}`} className="text-sm text-gray-600 hover:underline">
          {t("back")}
        </Link>
        <h1 className="mt-1 text-2xl font-bold">{t("title")}</h1>
        <p className="text-gray-600">{event.title}</p>
      </div>
      <SeatingBoard eventId={event.id} tables={tables ?? []} guests={guests} />
    </div>
  );
}
