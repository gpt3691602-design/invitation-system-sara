"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getStaffUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EVENT_FORM_FIELDS, eventFormSchema } from "@/lib/events/schema";
import { generateSlug } from "@/lib/events/slug";

export type EventFormState = {
  // Field name -> translation key under "eventForm.errors".
  fieldErrors?: Record<string, string>;
  // Translation key under "eventForm.errors".
  formError?: string;
};

function parseForm(formData: FormData) {
  const raw: Record<string, string> = {};
  for (const key of EVENT_FORM_FIELDS) {
    const v = formData.get(key);
    if (typeof v === "string") raw[key] = v;
    else if (key !== "use_custom_color" && key !== "is_active") raw[key] = "";
  }
  return eventFormSchema().safeParse(raw);
}

function toFieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    // The first problem per field is enough for the user to act on.
    out[key] ??= issue.message.startsWith("Invalid") ? "invalid" : issue.message;
  }
  return out;
}

export async function createEvent(_prev: EventFormState, formData: FormData): Promise<EventFormState> {
  const user = await getStaffUser();
  if (!user) return { formError: "notAllowed" };

  const parsed = parseForm(formData);
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error.issues) };

  const supabase = await createClient();
  let eventId: string | null = null;

  // A random 8-character slug collides with odds of about 1 in 850 billion,
  // but retry anyway rather than fail the user on a unique violation.
  for (let attempt = 0; attempt < 3 && !eventId; attempt++) {
    const { data, error } = await supabase
      .from("events")
      .insert({ ...parsed.data, slug: generateSlug(), created_by: user.id })
      .select("id")
      .single();
    if (data) eventId = data.id;
    else if (error?.code !== "23505") {
      console.error("createEvent failed", error);
      return { formError: "saveFailed" };
    }
  }
  if (!eventId) return { formError: "saveFailed" };

  revalidatePath("/admin");
  redirect(`/admin/events/${eventId}`);
}

export async function updateEvent(
  eventId: string,
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const user = await getStaffUser();
  if (!user) return { formError: "notAllowed" };

  const parsed = parseForm(formData);
  if (!parsed.success) return { fieldErrors: toFieldErrors(parsed.error.issues) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .update(parsed.data)
    .eq("id", eventId)
    .select("id")
    .maybeSingle();
  if (error || !data) {
    console.error("updateEvent failed", error);
    return { formError: "saveFailed" };
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/events/${eventId}`);
  redirect(`/admin/events/${eventId}`);
}

export type GeocodeResult =
  | { ok: true; lat: number; lng: number; label: string }
  | { ok: false; error: "notFound" | "failed" | "notAllowed" };

// Address -> coordinates through OpenStreetMap Nominatim. Free, no key, and
// fine for the volume of one business (its policy asks for at most one
// request per second and an identifying User-Agent).
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  if (!(await getStaffUser())) return { ok: false, error: "notAllowed" };
  const q = address.trim();
  if (q.length < 3 || q.length > 300) return { ok: false, error: "notFound" };

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("accept-language", "he,en");

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "invitation-system-sara/1.0 (event invitations)" },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, error: "failed" };
    const results = (await res.json()) as { lat: string; lon: string; display_name: string }[];
    const first = results[0];
    if (!first) return { ok: false, error: "notFound" };
    return {
      ok: true,
      lat: Math.round(Number(first.lat) * 1e6) / 1e6,
      lng: Math.round(Number(first.lon) * 1e6) / 1e6,
      label: first.display_name,
    };
  } catch (e) {
    console.error("geocodeAddress failed", e);
    return { ok: false, error: "failed" };
  }
}
