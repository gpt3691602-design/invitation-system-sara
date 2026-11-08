"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useDeferredValue, useMemo, useState, useTransition } from "react";
import { deleteRegistration } from "@/app/admin/events/[id]/registrations/actions";
import { buttonClass } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";

export type PanelRow = {
  id: string;
  fullName: string;
  phone: string; // display format
  phoneSearch: string; // digits only, for search
  email: string | null;
  guestCount: number;
  guestNames: string[];
  notes: string | null;
  status: "confirmed" | "cancelled";
  source: "self" | "manual";
  createdAt: string; // already formatted
  tableName: string | null;
  whatsappUrl: string;
  mailtoUrl: string | null;
};

type StatusFilter = "all" | "confirmed" | "cancelled";

export function RegistrationsPanel({ eventId, rows }: { eventId: string; rows: PanelRow[] }) {
  const t = useTranslations("registrations");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [deleting, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, "");
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!q) return true;
      return (
        r.fullName.toLowerCase().includes(q) ||
        r.guestNames.some((n) => n.toLowerCase().includes(q)) ||
        (r.email?.includes(q) ?? false) ||
        (r.notes?.toLowerCase().includes(q) ?? false) ||
        (r.tableName?.toLowerCase().includes(q) ?? false) ||
        // "0501234567" and "501234567" both find +972501234567
        (qDigits.length >= 3 && (r.phoneSearch.includes(qDigits) || r.phoneSearch.includes(qDigits.replace(/^0/, ""))))
      );
    });
  }, [rows, deferredQuery, status]);

  function onDelete(row: PanelRow) {
    if (!window.confirm(t("confirmDelete", { name: row.fullName }))) return;
    setDeleteError(false);
    startDelete(async () => {
      const res = await deleteRegistration(eventId, row.id);
      if (!res.ok) setDeleteError(true);
      router.refresh();
    });
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">
        {t("empty")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex-1">
          <span className="sr-only">{t("search")}</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("searchPlaceholder")} className={inputClass} />
        </label>
        <label>
          <span className="sr-only">{t("statusFilter")}</span>
          <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className={`${inputClass} sm:w-44`}>
            <option value="all">{t("filters.all")}</option>
            <option value="confirmed">{t("filters.confirmed")}</option>
            <option value="cancelled">{t("filters.cancelled")}</option>
          </select>
        </label>
      </div>

      {deleteError && <p role="alert" className="text-sm text-red-600">{t("deleteFailed")}</p>}
      <p className="text-sm text-gray-600" aria-live="polite">
        {t("showing", { shown: filtered.length, total: rows.length })}
      </p>

      <ul className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200 bg-white" aria-busy={deleting}>
        {filtered.map((r) => (
          <li key={r.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{r.fullName}</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{t("guests", { count: r.guestCount })}</span>
                {r.status === "cancelled" && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">{t("filters.cancelled")}</span>}
                {r.source === "manual" && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-800">{t("manual")}</span>}
                {r.tableName && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800">{r.tableName}</span>}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                <span dir="ltr">{r.phone}</span>
                {r.email && <span dir="ltr" className="break-all">{r.email}</span>}
                <span>{r.createdAt}</span>
              </div>
              {r.guestNames.length > 1 && <p className="text-sm text-gray-600">{r.guestNames.join(" · ")}</p>}
              {r.notes && <p className="rounded-lg bg-amber-50 px-2 py-1 text-sm text-amber-900">{r.notes}</p>}
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <a href={r.whatsappUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "min-h-9 px-3 text-emerald-700")}>
                {t("actions.whatsapp")}
              </a>
              {r.mailtoUrl && (
                <a href={r.mailtoUrl} className={buttonClass("secondary", "min-h-9 px-3")}>
                  {t("actions.email")}
                </a>
              )}
              <Link href={`/admin/events/${eventId}/registrations/${r.id}/edit`} className={buttonClass("secondary", "min-h-9 px-3")}>
                {t("actions.edit")}
              </Link>
              <button type="button" onClick={() => onDelete(r)} disabled={deleting} className={buttonClass("ghost", "min-h-9 px-3 text-red-700")}>
                {t("actions.delete")}
              </button>
            </div>
          </li>
        ))}
        {filtered.length === 0 && <li className="p-6 text-center text-gray-600">{t("noMatches")}</li>}
      </ul>
    </div>
  );
}
