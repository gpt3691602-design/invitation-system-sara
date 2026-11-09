"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getStaffUser } from "@/lib/auth";
import { MAX_TABLES } from "@/lib/tables";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: "notAllowed" | "invalid" | "failed" };

const uuid = z.uuid();
const tableFields = z.object({
  name: z.string().trim().min(1).max(60),
  capacity: z.coerce.number().int().min(1).max(200),
});

function refresh(eventId: string) {
  revalidatePath(`/admin/events/${eventId}/tables`);
  revalidatePath(`/admin/events/${eventId}`);
}

// Adds `count` tables named "<prefix> N", numbered after the existing ones.
export async function addTables(eventId: string, count: number, capacity: number, prefix: string): Promise<ActionResult> {
  if (!(await getStaffUser())) return { ok: false, error: "notAllowed" };
  const parsed = z
    .object({ eventId: uuid, count: z.number().int().min(1).max(100), capacity: z.number().int().min(1).max(200), prefix: z.string().trim().min(1).max(40) })
    .safeParse({ eventId, count, capacity, prefix });
  if (!parsed.success) return { ok: false, error: "invalid" };

  const supabase = await createClient();
  const { data: existing, error: readError } = await supabase
    .from("tables")
    .select("sort_order")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: false })
    .limit(1);
  if (readError) return { ok: false, error: "failed" };
  const start = (existing?.[0]?.sort_order ?? 0) + 1;

  const rows = Array.from({ length: count }, (_, i) => ({
    event_id: eventId,
    name: `${parsed.data.prefix} ${start + i}`,
    capacity,
    sort_order: start + i,
  }));
  const { error } = await supabase.from("tables").insert(rows);
  if (error) {
    console.error("addTables failed", error);
    return { ok: false, error: "failed" };
  }
  refresh(eventId);
  return { ok: true };
}

// Sets how many tables the hall has. Growing adds "<prefix> N" tables at the
// end with the given capacity; shrinking removes the LAST tables (by order).
// Guests seated at removed tables go back to "unseated" (cascade); the
// screen asks for confirmation before that happens.
export async function setTableCount(eventId: string, target: number, capacity: number, prefix: string): Promise<ActionResult> {
  if (!(await getStaffUser())) return { ok: false, error: "notAllowed" };
  const parsed = z
    .object({
      eventId: uuid,
      target: z.number().int().min(0).max(MAX_TABLES),
      capacity: z.number().int().min(1).max(200),
      prefix: z.string().trim().min(1).max(40),
    })
    .safeParse({ eventId, target, capacity, prefix });
  if (!parsed.success) return { ok: false, error: "invalid" };

  const supabase = await createClient();
  const { data: existing, error: readError } = await supabase
    .from("tables")
    .select("id, sort_order")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });
  if (readError || !existing) return { ok: false, error: "failed" };

  if (target > existing.length) {
    const start = (existing.at(-1)?.sort_order ?? 0) + 1;
    const rows = Array.from({ length: target - existing.length }, (_, i) => ({
      event_id: eventId,
      name: `${parsed.data.prefix} ${start + i}`,
      capacity,
      sort_order: start + i,
    }));
    const { error } = await supabase.from("tables").insert(rows);
    if (error) {
      console.error("setTableCount insert failed", error);
      return { ok: false, error: "failed" };
    }
  } else if (target < existing.length) {
    const removeIds = existing.slice(target).map((tb) => tb.id);
    const { error } = await supabase.from("tables").delete().eq("event_id", eventId).in("id", removeIds);
    if (error) {
      console.error("setTableCount delete failed", error);
      return { ok: false, error: "failed" };
    }
  }
  refresh(eventId);
  return { ok: true };
}

export async function updateTable(eventId: string, tableId: string, name: string, capacity: number): Promise<ActionResult> {
  if (!(await getStaffUser())) return { ok: false, error: "notAllowed" };
  const parsed = tableFields.safeParse({ name, capacity });
  if (!parsed.success || !uuid.safeParse(tableId).success) return { ok: false, error: "invalid" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tables")
    .update(parsed.data)
    .eq("id", tableId)
    .eq("event_id", eventId)
    .select("id");
  if (error || !data?.length) return { ok: false, error: "failed" };
  refresh(eventId);
  return { ok: true };
}

// Deleting a table returns its guests to "unseated" (cascade on the link rows).
export async function deleteTable(eventId: string, tableId: string): Promise<ActionResult> {
  if (!(await getStaffUser())) return { ok: false, error: "notAllowed" };
  const supabase = await createClient();
  const { data, error } = await supabase.from("tables").delete().eq("id", tableId).eq("event_id", eventId).select("id");
  if (error || !data?.length) return { ok: false, error: "failed" };
  refresh(eventId);
  return { ok: true };
}

// Seats a registration at a table, or unseats it when tableId is null.
export async function assignRegistration(eventId: string, registrationId: string, tableId: string | null): Promise<ActionResult> {
  if (!(await getStaffUser())) return { ok: false, error: "notAllowed" };
  if (!uuid.safeParse(registrationId).success || (tableId !== null && !uuid.safeParse(tableId).success)) {
    return { ok: false, error: "invalid" };
  }
  const supabase = await createClient();
  const { error } =
    tableId === null
      ? await supabase.from("registration_tables").delete().eq("registration_id", registrationId).eq("event_id", eventId)
      : await supabase
          .from("registration_tables")
          .upsert({ registration_id: registrationId, table_id: tableId, event_id: eventId }, { onConflict: "registration_id" });
  if (error) {
    console.error("assignRegistration failed", error);
    return { ok: false, error: "failed" };
  }
  refresh(eventId);
  return { ok: true };
}
