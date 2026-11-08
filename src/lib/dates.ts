// Events are entered and shown in Israel time, stored in UTC.
export const EVENT_TIME_ZONE = "Asia/Jerusalem";

function offsetMs(utcMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - utcMs;
}

// "2026-12-01T19:30" (wall clock in Israel) -> ISO string in UTC.
// Returns null for malformed input.
export function localInputToUtcIso(value: string, timeZone = EVENT_TIME_ZONE): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number);
  const wall = Date.UTC(y, mo - 1, d, h, mi);
  if (Number.isNaN(wall)) return null;
  // Two passes settle the offset across a DST change.
  let utc = wall - offsetMs(wall, timeZone);
  utc = wall - offsetMs(utc, timeZone);
  return new Date(utc).toISOString();
}

// ISO string in UTC -> "2026-12-01T19:30" for <input type="datetime-local">.
export function utcIsoToLocalInput(iso: string | null | undefined, timeZone = EVENT_TIME_ZONE): string {
  if (!iso) return "";
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms)) return "";
  const local = new Date(ms + offsetMs(ms, timeZone));
  return local.toISOString().slice(0, 16);
}
