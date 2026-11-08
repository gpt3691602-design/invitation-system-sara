import { getTranslations } from "next-intl/server";
import { EventForm, emptyEventDefaults } from "@/components/EventForm";
import { createEvent } from "../actions";

export default async function NewEventPage() {
  const t = await getTranslations("eventForm");
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">{t("newTitle")}</h1>
      <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
        <EventForm action={createEvent} defaults={emptyEventDefaults} submitLabel={t("create")} />
      </div>
    </div>
  );
}
