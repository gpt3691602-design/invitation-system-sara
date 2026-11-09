"use server";

import { headers } from "next/headers";
import { normalizePhone } from "@/lib/phone";
import { rateLimit } from "@/lib/rate-limit";
import { registrationSchema } from "@/lib/registration/schema";
import { createPublicClient } from "@/lib/supabase/public";

export type RegistrationState =
  | { status: "idle" }
  | { status: "error"; fieldErrors?: Record<string, string>; formError?: string }
  | { status: "success"; result: "created" | "updated"; fullName: string; guestCount: number };

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function registerGuest(
  slug: string,
  _prev: RegistrationState,
  formData: FormData,
): Promise<RegistrationState> {
  // Honeypot: a field people never see. Bots that fill every input get a
  // success-looking response and nothing is saved.
  if (String(formData.get("website") ?? "") !== "") {
    return { status: "success", result: "created", fullName: String(formData.get("full_name") ?? "").trim(), guestCount: 1 };
  }

  const parsed = registrationSchema.safeParse({
    full_name: formData.get("full_name") ?? "",
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? "",
    guest_count: formData.get("guest_count") ?? "1",
    companions: formData.getAll("companions").map(String),
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] ??= issue.message;
    }
    return { status: "error", fieldErrors };
  }

  // Counted only for valid submissions (invalid ones never reach the
  // database). The limit is generous on purpose: Israeli mobile carriers put
  // many subscribers behind one IP (CGNAT), and a link posted to a WhatsApp
  // group is opened by everyone within minutes.
  if (!rateLimit(`register:${await clientIp()}`, 30, 10 * 60 * 1000)) {
    return { status: "error", formError: "rateLimited" };
  }

  const v = parsed.data;
  const { data, error } = await createPublicClient().rpc("register_guest", {
    p_slug: slug,
    p_full_name: v.full_name,
    p_phone: v.phone,
    p_email: v.email,
    p_guest_count: v.guest_count,
    p_guest_names: v.guest_names,
    p_notes: v.notes,
  });
  if (error) {
    console.error("register_guest failed", error);
    return { status: "error", formError: "failed" };
  }

  switch (data) {
    case "created":
    case "updated":
      return { status: "success", result: data, fullName: v.full_name, guestCount: v.guest_count };
    case "closed":
    case "full":
    case "not_found":
      return { status: "error", formError: data };
    default:
      return { status: "error", formError: "failed" };
  }
}

export type FindTableState =
  | { status: "idle" }
  | { status: "found"; tableName: string; guestCount: number }
  | { status: "not_seated" | "not_found" | "closed" | "invalid" | "rateLimited" | "failed" };

// "What's my table?" on the event day. Rate limited because it answers
// questions about phone numbers; the database returns no names.
export async function findTable(slug: string, _prev: FindTableState, formData: FormData): Promise<FindTableState> {
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  if (!phone) return { status: "invalid" };
  if (!rateLimit(`table:${await clientIp()}`, 20, 10 * 60 * 1000)) return { status: "rateLimited" };

  const { data, error } = await createPublicClient().rpc("find_my_table", { p_slug: slug, p_phone: phone });
  const row = data?.[0];
  if (error || !row) {
    console.error("find_my_table failed", error);
    return { status: "failed" };
  }
  if (row.status === "found" && row.table_name) {
    return { status: "found", tableName: row.table_name, guestCount: row.guest_count ?? 1 };
  }
  if (row.status === "not_seated" || row.status === "not_found" || row.status === "closed") return { status: row.status };
  return { status: "failed" };
}
