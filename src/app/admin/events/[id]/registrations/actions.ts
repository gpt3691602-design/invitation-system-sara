"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getStaffUser } from "@/lib/auth";
import { parseStaffRegistration } from "@/lib/registration/staff-schema";
import { createClient } from "@/lib/supabase/server";

export type RegistrationFormState = {
  fieldErrors?: Record<string, string>;
  formError?: string;
};

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) out[String(i.path[0])] ??= i.message.startsWith("Invalid") ? "invalid" : i.message;
  return out;
}

export async function createRegistration(
  eventId: string,
  _prev: RegistrationFormState,
  formData: FormData,
): Promise<RegistrationFormState> {
  if (!(await getStaffUser())) return { formError: "notAllowed" };
  const parsed = parseStaffRegistration(formData);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("registrations")
    .insert({ ...parsed.data, event_id: eventId, source: "manual" });
  if (error) {
    if (error.code === "23505") return { fieldErrors: { phone: "phoneTaken" } };
    console.error("createRegistration failed", error);
    return { formError: "saveFailed" };
  }

  revalidatePath(`/admin/events/${eventId}`);
  redirect(`/admin/events/${eventId}`);
}

export async function updateRegistration(
  eventId: string,
  registrationId: string,
  _prev: RegistrationFormState,
  formData: FormData,
): Promise<RegistrationFormState> {
  if (!(await getStaffUser())) return { formError: "notAllowed" };
  const parsed = parseStaffRegistration(formData);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error.issues) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("registrations")
    .update(parsed.data)
    .eq("id", registrationId)
    .eq("event_id", eventId)
    .select("id")
    .maybeSingle();
  if (error || !data) {
    if (error?.code === "23505") return { fieldErrors: { phone: "phoneTaken" } };
    console.error("updateRegistration failed", error);
    return { formError: "saveFailed" };
  }

  revalidatePath(`/admin/events/${eventId}`);
  redirect(`/admin/events/${eventId}`);
}

export async function deleteRegistration(eventId: string, registrationId: string): Promise<{ ok: boolean }> {
  if (!(await getStaffUser())) return { ok: false };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("registrations")
    .delete()
    .eq("id", registrationId)
    .eq("event_id", eventId)
    .select("id");
  if (error || !data?.length) {
    console.error("deleteRegistration failed", error);
    return { ok: false };
  }
  revalidatePath(`/admin/events/${eventId}`);
  return { ok: true };
}
