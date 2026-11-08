import ExcelJS from "exceljs";
import { getLocale, getTranslations } from "next-intl/server";
import { getStaffUser } from "@/lib/auth";
import { EVENT_TIME_ZONE } from "@/lib/dates";
import { formatPhone } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";

// Excel export of an event's registrations. Staff only: the proxy does not
// cover /api, so the check happens here (and RLS backs it up).
export async function GET(_req: Request, ctx: RouteContext<"/api/events/[id]/export">) {
  if (!(await getStaffUser())) return new Response("Unauthorized", { status: 401 });

  const { id } = await ctx.params;
  const supabase = await createClient();
  const [{ data: event }, { data: regs, error }, { data: tables }, { data: seatLinks }] = await Promise.all([
    supabase.from("events").select("title, slug").eq("id", id).maybeSingle(),
    supabase.from("registrations").select("*").eq("event_id", id).order("created_at"),
    supabase.from("tables").select("id, name").eq("event_id", id),
    supabase.from("registration_tables").select("registration_id, table_id").eq("event_id", id),
  ]);
  if (!event) return new Response("Not found", { status: 404 });
  if (error) return new Response("Export failed", { status: 500 });

  const tableName = new Map((tables ?? []).map((tb) => [tb.id, tb.name]));
  const seatOf = new Map((seatLinks ?? []).map((l) => [l.registration_id, tableName.get(l.table_id) ?? ""]));
  const t = await getTranslations("export");
  const locale = await getLocale();
  const dateFmt = new Intl.DateTimeFormat(locale === "he" ? "he-IL" : "en-GB", {
    timeZone: EVENT_TIME_ZONE,
    dateStyle: "short",
    timeStyle: "short",
  });

  const wb = new ExcelJS.Workbook();
  wb.creator = "invitation-system-sara";
  const ws = wb.addWorksheet(t("sheet"), {
    views: [{ state: "frozen", ySplit: 1, rightToLeft: locale === "he" }],
  });
  ws.columns = [
    { header: t("fullName"), key: "full_name", width: 24 },
    { header: t("phone"), key: "phone", width: 16 },
    { header: t("email"), key: "email", width: 28 },
    { header: t("guestCount"), key: "guest_count", width: 10 },
    { header: t("guestNames"), key: "guest_names", width: 40 },
    { header: t("table"), key: "table", width: 14 },
    { header: t("notes"), key: "notes", width: 36 },
    { header: t("status"), key: "status", width: 12 },
    { header: t("source"), key: "source", width: 12 },
    { header: t("createdAt"), key: "created_at", width: 18 },
  ];
  ws.getRow(1).font = { bold: true };
  ws.autoFilter = { from: "A1", to: "J1" };

  for (const r of regs ?? []) {
    const names = Array.isArray(r.guest_names) ? r.guest_names.filter((n): n is string => typeof n === "string") : [];
    // Values go in as plain strings and numbers. ExcelJS never turns a
    // string into a formula, so guest input like "=HYPERLINK(...)" stays text.
    ws.addRow({
      full_name: r.full_name,
      phone: formatPhone(r.phone),
      email: r.email ?? "",
      guest_count: r.guest_count,
      guest_names: names.join(", "),
      table: seatOf.get(r.id) ?? "",
      notes: r.notes ?? "",
      status: t(`statuses.${r.status}`),
      source: t(`sources.${r.source}`),
      created_at: dateFmt.format(new Date(r.created_at)),
    });
  }

  const confirmed = (regs ?? []).filter((r) => r.status === "confirmed");
  ws.addRow({});
  const total = ws.addRow({
    full_name: t("total"),
    guest_count: confirmed.reduce((s, r) => s + r.guest_count, 0),
  });
  total.font = { bold: true };

  const buffer = await wb.xlsx.writeBuffer();
  const safeName = event.title.replace(/[\\/:*?"<>|]+/g, " ").trim().slice(0, 80) || event.slug;
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      // ASCII fallback plus the real (Hebrew) name for browsers that support RFC 5987.
      "Content-Disposition": `attachment; filename="${event.slug}.xlsx"; filename*=UTF-8''${encodeURIComponent(safeName)}.xlsx`,
      "Cache-Control": "no-store",
    },
  });
}
