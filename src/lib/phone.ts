// Phone numbers are stored in E.164 (+972501234567) so wa.me links work.
// Accepts the ways people actually type Israeli numbers:
//   050-123-4567, 0501234567, +972 50 123 4567, 972501234567, 00972501234567
// and any international number that starts with + or 00.
export function normalizePhone(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  let digits = trimmed.replace(/[\s\-().\u200e\u200f]/g, "");
  if (!/^\+?\d+$/.test(digits)) return null;

  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = "972" + digits.slice(1); // local Israeli number
  // A bare 972... is already international.

  if (digits.startsWith("9720")) digits = "972" + digits.slice(4); // +972 0501234567
  if (digits.startsWith("972") && !/^972\d{8,9}$/.test(digits)) return null;
  if (!/^[1-9]\d{6,14}$/.test(digits)) return null;
  return "+" + digits;
}

// Digits only, for wa.me links.
export function phoneDigits(e164: string): string {
  return e164.replace(/\D/g, "");
}

// Friendly display: Israeli numbers in local format, others as stored.
export function formatPhone(e164: string): string {
  const m = /^\+972(5\d)(\d{3})(\d{4})$/.exec(e164);
  if (m) return `0${m[1]}-${m[2]}-${m[3]}`;
  const l = /^\+972([2-9])(\d{3})(\d{4})$/.exec(e164);
  if (l) return `0${l[1]}-${l[2]}-${l[3]}`;
  return e164;
}
