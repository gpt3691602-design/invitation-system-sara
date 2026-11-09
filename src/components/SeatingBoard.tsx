"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useOptimistic, useState, useTransition } from "react";
import { assignRegistration, deleteTable, setTableCount, updateTable, type ActionResult } from "@/app/admin/events/[id]/tables/actions";
import { MAX_TABLES } from "@/lib/tables";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";

export type SeatingTable = { id: string; name: string; capacity: number };
export type SeatingGuest = { id: string; fullName: string; guestCount: number; names: string[]; tableId: string | null };

const DRAG_TYPE = "application/x-registration-id";

export function SeatingBoard({ eventId, tables, guests }: { eventId: string; tables: SeatingTable[]; guests: SeatingGuest[] }) {
  const t = useTranslations("seating");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  // The board moves guests instantly, but saving takes a moment. Warn before
  // the tab closes or reloads mid-save, or the last move would be lost.
  useEffect(() => {
    if (!pending) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [pending]);

  // Moves show instantly; the server result then replaces them.
  const [seated, moveOptimistic] = useOptimistic(
    guests,
    (state, move: { id: string; tableId: string | null }) => state.map((g) => (g.id === move.id ? { ...g, tableId: move.tableId } : g)),
  );

  const byTable = useMemo(() => {
    const map = new Map<string | null, SeatingGuest[]>();
    for (const g of seated) map.set(g.tableId, [...(map.get(g.tableId) ?? []), g]);
    return map;
  }, [seated]);

  const unseated = (byTable.get(null) ?? []).filter((g) => {
    const q = query.trim();
    return !q || g.fullName.includes(q) || g.names.some((n) => n.includes(q));
  });
  const seatedGuests = seated.filter((g) => g.tableId).reduce((s, g) => s + g.guestCount, 0);
  const totalGuests = seated.reduce((s, g) => s + g.guestCount, 0);
  const totalSeats = tables.reduce((s, tb) => s + tb.capacity, 0);

  function run(action: () => Promise<ActionResult>, optimistic?: () => void) {
    setError(null);
    startTransition(async () => {
      optimistic?.();
      const res = await action();
      if (!res.ok) setError(t(`errors.${res.error}`));
      router.refresh();
    });
  }

  const move = (id: string, tableId: string | null) =>
    run(() => assignRegistration(eventId, id, tableId), () => moveOptimistic({ id, tableId }));

  const dropProps = (tableId: string | null) => ({
    onDragOver: (e: React.DragEvent) => {
      if (e.dataTransfer.types.includes(DRAG_TYPE)) {
        e.preventDefault();
        setDropTarget(tableId ?? "none");
      }
    },
    onDragLeave: () => setDropTarget(null),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDropTarget(null);
      const id = e.dataTransfer.getData(DRAG_TYPE);
      if (id) move(id, tableId);
    },
  });

  return (
    <div className="space-y-6">
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <p role="status" aria-live="polite" className="fixed bottom-4 start-4 z-20 rounded-full bg-gray-900 px-4 py-2 text-sm text-white shadow-lg empty:hidden">
        {pending ? t("saving") : ""}
      </p>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={t("stats.tables")} value={tables.length} />
        <Stat label={t("stats.seats")} value={totalSeats} />
        <Stat label={t("stats.seated")} value={`${seatedGuests} / ${totalGuests}`} />
        <Stat label={t("stats.unseated")} value={totalGuests - seatedGuests} warn={totalGuests - seatedGuests > 0} />
      </dl>

      <HallSize
        key={tables.length}
        tables={tables}
        byTable={byTable}
        totalGuests={totalGuests}
        pending={pending}
        onSet={(target, capacity) => run(() => setTableCount(eventId, target, capacity, t("tablePrefix")))}
      />

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        {/* Unseated guests */}
        <section
          aria-labelledby="unseated-heading"
          {...dropProps(null)}
          className={`h-fit space-y-3 rounded-xl border bg-white p-4 lg:sticky lg:top-4 ${dropTarget === "none" ? "border-gray-900 ring-2 ring-gray-900" : "border-gray-200"}`}
        >
          <h2 id="unseated-heading" className="font-semibold">
            {t("unseated")} ({(byTable.get(null) ?? []).length})
          </h2>
          <label>
            <span className="sr-only">{t("search")}</span>
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search")} className={inputClass} />
          </label>
          {tables.length > 0 && <p className="text-xs text-gray-500">{t("dragHint")}</p>}
          <ul className="max-h-[60vh] space-y-2 overflow-y-auto">
            {unseated.map((g) => (
              <GuestCard key={g.id} guest={g} tables={tables} onMove={move} disabled={pending} />
            ))}
            {unseated.length === 0 && <li className="py-4 text-center text-sm text-gray-500">{t("allSeated")}</li>}
          </ul>
        </section>

        {/* Tables */}
        <section aria-label={t("tablesLabel")}>
          {tables.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">{t("noTables")}</div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {tables.map((tb) => {
                const at = byTable.get(tb.id) ?? [];
                const used = at.reduce((s, g) => s + g.guestCount, 0);
                const over = used > tb.capacity;
                return (
                  <li
                    key={tb.id}
                    {...dropProps(tb.id)}
                    className={`space-y-3 rounded-xl border bg-white p-4 ${dropTarget === tb.id ? "border-gray-900 ring-2 ring-gray-900" : over ? "border-red-400" : "border-gray-200"}`}
                  >
                    <TableHeader
                      table={tb}
                      used={used}
                      over={over}
                      pending={pending}
                      onSave={(name, capacity) => run(() => updateTable(eventId, tb.id, name, capacity))}
                      onDelete={() => {
                        if (window.confirm(t("confirmDelete", { name: tb.name, count: at.length }))) run(() => deleteTable(eventId, tb.id));
                      }}
                    />
                    <ul className="space-y-2">
                      {at.map((g) => (
                        <GuestCard key={g.id} guest={g} tables={tables} onMove={move} disabled={pending} />
                      ))}
                      {at.length === 0 && <li className="rounded-lg border border-dashed border-gray-200 py-4 text-center text-sm text-gray-400">{t("emptyTable")}</li>}
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: number | string; warn?: boolean }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <dt className="text-sm text-gray-600">{label}</dt>
      <dd className={`mt-1 text-2xl font-bold tabular-nums ${warn ? "text-amber-700" : ""}`}>{value}</dd>
    </div>
  );
}

function GuestCard({
  guest,
  tables,
  onMove,
  disabled,
}: {
  guest: SeatingGuest;
  tables: SeatingTable[];
  onMove: (id: string, tableId: string | null) => void;
  disabled: boolean;
}) {
  const t = useTranslations("seating");
  return (
    <li
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(DRAG_TYPE, guest.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className="cursor-grab rounded-lg border border-gray-200 bg-gray-50 p-2.5 active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{guest.fullName}</p>
          {guest.names.length > 1 && <p className="truncate text-xs text-gray-500">{guest.names.slice(1).join(" · ")}</p>}
        </div>
        <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs ring-1 ring-gray-200">{t("people", { count: guest.guestCount })}</span>
      </div>
      <label className="mt-2 block">
        <span className="sr-only">{t("moveTo", { name: guest.fullName })}</span>
        <select
          value={guest.tableId ?? ""}
          disabled={disabled}
          onChange={(e) => onMove(guest.id, e.target.value || null)}
          className="block min-h-9 w-full rounded-md border border-gray-300 bg-white px-2 text-sm"
        >
          <option value="">{t("notSeated")}</option>
          {tables.map((tb) => (
            <option key={tb.id} value={tb.id}>
              {tb.name}
            </option>
          ))}
        </select>
      </label>
    </li>
  );
}

function TableHeader({
  table,
  used,
  over,
  pending,
  onSave,
  onDelete,
}: {
  table: SeatingTable;
  used: number;
  over: boolean;
  pending: boolean;
  onSave: (name: string, capacity: number) => void;
  onDelete: () => void;
}) {
  const t = useTranslations("seating");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(table.name);
  const [capacity, setCapacity] = useState(String(table.capacity));

  if (editing) {
    return (
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(name, Number(capacity));
          setEditing(false);
        }}
      >
        <div className="flex gap-2">
          <label className="flex-1">
            <span className="sr-only">{t("tableName")}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required className={`${inputClass} min-h-9`} />
          </label>
          <label className="w-20">
            <span className="sr-only">{t("capacity")}</span>
            <input type="number" min={1} max={200} value={capacity} onChange={(e) => setCapacity(e.target.value)} required className={`${inputClass} min-h-9`} />
          </label>
        </div>
        <div className="flex gap-2">
          <Button type="submit" className="min-h-9" disabled={pending}>{t("save")}</Button>
          <Button type="button" variant="ghost" className="min-h-9" onClick={() => setEditing(false)}>{t("cancel")}</Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <h3 className="font-semibold">{table.name}</h3>
        <p className={`text-sm tabular-nums ${over ? "font-semibold text-red-600" : "text-gray-600"}`}>
          {t("occupancy", { used, capacity: table.capacity })}
          {over && ` · ${t("over")}`}
        </p>
      </div>
      <div className="flex gap-1">
        <button type="button" onClick={() => setEditing(true)} className="rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-gray-100">
          {t("edit")}
        </button>
        <button type="button" onClick={onDelete} disabled={pending} className="rounded-md px-2 py-1 text-sm text-red-700 hover:bg-red-50">
          {t("delete")}
        </button>
      </div>
    </div>
  );
}

// "How many tables does the hall have?" Sets the total: more adds tables at the
// end, fewer removes the last ones (with a warning when guests sit there).
function HallSize({
  tables,
  byTable,
  totalGuests,
  pending,
  onSet,
}: {
  tables: SeatingTable[];
  byTable: Map<string | null, SeatingGuest[]>;
  totalGuests: number;
  pending: boolean;
  onSet: (target: number, capacity: number) => void;
}) {
  const t = useTranslations("seating.hall");
  const empty = tables.length === 0;
  const [count, setCount] = useState(String(empty ? "" : tables.length));
  const [capacity, setCapacity] = useState(String(tables.at(-1)?.capacity ?? 10));
  const target = Number(count);
  const cap = Number(capacity) || 10;
  const valid = Number.isInteger(target) && target >= (empty ? 1 : 0) && target <= MAX_TABLES && count !== "";
  const changed = valid && target !== tables.length;
  // Families sit together, so leave ~10% of the seats as slack.
  const recommended = totalGuests > 0 ? Math.ceil((totalGuests * 1.1) / cap) : null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!changed) return;
    if (target < tables.length) {
      const removed = tables.slice(target);
      const parties = removed.reduce((s, tb) => s + (byTable.get(tb.id)?.length ?? 0), 0);
      const range = removed.length === 1 ? removed[0].name : `${removed[0].name} – ${removed.at(-1)!.name}`;
      if (!window.confirm(t("confirmShrink", { count: removed.length, range, parties }))) return;
    }
    onSet(target, cap);
  }

  return (
    <form
      onSubmit={submit}
      className={`rounded-xl border p-4 sm:p-5 ${empty ? "border-2 border-gray-900 bg-white" : "border-gray-200 bg-white"}`}
    >
      <h2 className={empty ? "text-xl font-bold" : "font-semibold"}>{empty ? t("question") : t("title")}</h2>
      {!empty && (
        <p className="mt-1 text-sm text-gray-600">{t("current", { tables: tables.length, seats: tables.reduce((s, tb) => s + tb.capacity, 0) })}</p>
      )}
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="space-y-1">
          <span className="block text-sm font-medium">{t("count")}</span>
          <input
            type="number"
            inputMode="numeric"
            min={empty ? 1 : 0}
            max={MAX_TABLES}
            value={count}
            onChange={(e) => setCount(e.target.value)}
            required
            className={`${inputClass} w-28 text-lg`}
          />
        </label>
        <label className="space-y-1">
          <span className="block text-sm font-medium">{t("capacity")}</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={200}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            required
            className={`${inputClass} w-28 text-lg`}
          />
        </label>
        <Button type="submit" disabled={pending || !changed}>
          {empty ? t("create") : target < tables.length ? t("shrink", { count: tables.length - target }) : t("update")}
        </Button>
      </div>
      <p className="mt-3 text-sm text-gray-600">
        {!empty && t("capacityNote")}
        {recommended !== null && (
          <span className="block font-medium text-emerald-800">{t("recommend", { guests: totalGuests, tables: recommended, capacity: cap })}</span>
        )}
      </p>
    </form>
  );
}
