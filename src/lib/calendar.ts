// Calendar links for the invitation page. The schema has no end time, so
// events are given a default length.
const DEFAULT_DURATION_MS = 3 * 60 * 60 * 1000;

export type CalendarEvent = {
  slug: string;
  title: string;
  description: string | null;
  start: string; // ISO UTC
  location: string | null;
  url: string;
};

function utcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function endOf(start: string) {
  return new Date(new Date(start).getTime() + DEFAULT_DURATION_MS);
}

export function googleCalendarUrl(e: CalendarEvent): string {
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", e.title);
  url.searchParams.set("dates", `${utcStamp(new Date(e.start))}/${utcStamp(endOf(e.start))}`);
  url.searchParams.set("details", [e.description, e.url].filter(Boolean).join("\n\n"));
  if (e.location) url.searchParams.set("location", e.location);
  return url.toString();
}

// RFC 5545 text escaping.
function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

// Lines longer than 75 octets are folded; Hebrew is 2 bytes per letter, so
// count bytes, and never split a character.
function fold(line: string): string {
  const out: string[] = [];
  let current = "";
  let bytes = 0;
  for (const ch of line) {
    const size = Buffer.byteLength(ch, "utf8");
    const limit = out.length === 0 ? 75 : 74; // continuation lines start with a space
    if (bytes + size > limit) {
      out.push(current);
      current = "";
      bytes = 0;
    }
    current += ch;
    bytes += size;
  }
  out.push(current);
  return out.join("\r\n ");
}

export function buildIcs(e: CalendarEvent, host: string): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//invitation-system-sara//HE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.slug}@${host}`,
    `DTSTAMP:${utcStamp(new Date())}`,
    `DTSTART:${utcStamp(new Date(e.start))}`,
    `DTEND:${utcStamp(endOf(e.start))}`,
    `SUMMARY:${escapeText(e.title)}`,
    `DESCRIPTION:${escapeText([e.description, e.url].filter(Boolean).join("\n\n"))}`,
    ...(e.location ? [`LOCATION:${escapeText(e.location)}`] : []),
    `URL:${e.url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

export function navigationUrls(lat: number | null, lng: number | null, address: string | null) {
  if (lat !== null && lng !== null) {
    return {
      waze: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`,
      google: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    };
  }
  if (address) {
    const q = encodeURIComponent(address);
    return {
      waze: `https://waze.com/ul?q=${q}&navigate=yes`,
      google: `https://www.google.com/maps/dir/?api=1&destination=${q}`,
    };
  }
  return null;
}
