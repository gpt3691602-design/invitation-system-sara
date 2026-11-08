import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RegistrationStaffForm } from "@/components/RegistrationStaffForm";
import { formatPhone } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";
import { updateRegistration } from "../../actions";

export default async function EditRegistrationPage({ params }: PageProps<"/admin/events/[id]/registrations/[rid]/edit">) {
  const { id, rid } = await params;
  const t = await getTranslations("registrationForm");
  const supabase = await createClient();
  const { data: reg } = await supabase
    .from("registrations")
    .select("*, events(title)")
    .eq("id", rid)
    .eq("event_id", id)
    .maybeSingle();
  if (!reg) notFound();

  const names = Array.isArray(reg.guest_names) ? reg.guest_names.filter((n): n is string => typeof n === "string") : [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-sm text-gray-600">{reg.events?.title}</p>
        <h1 className="text-2xl font-bold">{t("editTitle")}</h1>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
        <RegistrationStaffForm
          action={updateRegistration.bind(null, id, rid)}
          submitLabel={t("save")}
          cancelHref={`/admin/events/${id}`}
          defaults={{
            full_name: reg.full_name,
            phone: formatPhone(reg.phone),
            email: reg.email ?? "",
            guest_count: reg.guest_count,
            guest_names: names.join("\n"),
            notes: reg.notes ?? "",
            status: reg.status,
          }}
        />
      </div>
    </div>
  );
}
