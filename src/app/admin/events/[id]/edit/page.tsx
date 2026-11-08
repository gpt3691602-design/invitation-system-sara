import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { EventForm } from "@/components/EventForm";
import { utcIsoToLocalInput } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { updateEvent } from "../../actions";

export default async function EditEventPage({ params }: PageProps<"/admin/events/[id]/edit">) {
  const { id } = await params;
  const t = await getTranslations("eventForm");
  const supabase = await createClient();
  const { data: event } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (!event) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">{t("editTitle")}</h1>
      <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
        <EventForm
          action={updateEvent.bind(null, event.id)}
          submitLabel={t("save")}
          defaults={{
            title: event.title,
            event_type: event.event_type,
            description: event.description ?? "",
            date_time: utcIsoToLocalInput(event.date_time),
            venue_name: event.venue_name ?? "",
            address: event.address ?? "",
            lat: event.lat?.toString() ?? "",
            lng: event.lng?.toString() ?? "",
            template_id: event.template_id,
            media_url: event.media_url,
            primary_color: event.primary_color,
            gift_link_url: event.gift_link_url ?? "",
            rsvp_deadline: utcIsoToLocalInput(event.rsvp_deadline),
            max_guests: event.max_guests?.toString() ?? "",
            is_active: event.is_active,
          }}
        />
      </div>
    </div>
  );
}
