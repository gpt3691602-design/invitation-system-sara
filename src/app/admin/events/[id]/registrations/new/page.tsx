import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RegistrationStaffForm, emptyRegistration } from "@/components/RegistrationStaffForm";
import { createClient } from "@/lib/supabase/server";
import { createRegistration } from "../actions";

export default async function NewRegistrationPage({ params }: PageProps<"/admin/events/[id]/registrations/new">) {
  const { id } = await params;
  const t = await getTranslations("registrationForm");
  const supabase = await createClient();
  const { data: event } = await supabase.from("events").select("id, title").eq("id", id).maybeSingle();
  if (!event) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-sm text-gray-600">{event.title}</p>
        <h1 className="text-2xl font-bold">{t("newTitle")}</h1>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
        <RegistrationStaffForm
          action={createRegistration.bind(null, event.id)}
          defaults={emptyRegistration}
          submitLabel={t("add")}
          cancelHref={`/admin/events/${event.id}`}
        />
      </div>
    </div>
  );
}
