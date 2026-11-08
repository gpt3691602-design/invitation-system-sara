import { z } from "zod";
import { localInputToUtcIso } from "@/lib/dates";
import { templateIds } from "@/templates/registry";

// Error messages are translation keys under "eventForm.errors".
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { message: "tooLong" })
    .transform((v) => (v === "" ? null : v));

const optionalNumber = (min: number, max: number) =>
  z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (v === "") return null;
      const n = Number(v);
      if (!Number.isFinite(n) || n < min || n > max) {
        ctx.addIssue({ code: "custom", message: "invalidNumber" });
        return z.NEVER;
      }
      return n;
    });

const localDateTime = z.string().transform((v, ctx) => {
  if (v.trim() === "") return null;
  const iso = localInputToUtcIso(v);
  if (!iso) {
    ctx.addIssue({ code: "custom", message: "invalidDate" });
    return z.NEVER;
  }
  return iso;
});

const httpsUrl = z
  .string()
  .trim()
  .transform((v, ctx) => {
    if (v === "") return null;
    try {
      const u = new URL(v);
      if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error();
      return u.toString();
    } catch {
      ctx.addIssue({ code: "custom", message: "invalidUrl" });
      return z.NEVER;
    }
  });

// Media must come from this project's public bucket, so the page never
// embeds an arbitrary third-party URL.
function mediaUrl() {
  const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/event-media/`;
  return z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (v === "") return null;
      if (!v.startsWith(prefix)) {
        ctx.addIssue({ code: "custom", message: "invalidMedia" });
        return z.NEVER;
      }
      return v;
    });
}

export function eventFormSchema() {
  return z
    .object({
      title: z.string().trim().min(1, { message: "required" }).max(200, { message: "tooLong" }),
      event_type: z.enum(["private", "business"]),
      description: optionalText(5000),
      date_time: localDateTime.refine((v) => v !== null, { message: "required" }),
      venue_name: optionalText(200),
      address: optionalText(300),
      lat: optionalNumber(-90, 90),
      lng: optionalNumber(-180, 180),
      template_id: z.enum(templateIds),
      media_url: mediaUrl(),
      use_custom_color: z.string().optional(),
      primary_color: z.string().trim(),
      gift_link_url: httpsUrl,
      rsvp_deadline: localDateTime,
      max_guests: optionalNumber(1, 100000),
      is_active: z.string().optional(),
    })
    .superRefine((v, ctx) => {
      if ((v.lat === null) !== (v.lng === null)) {
        ctx.addIssue({ code: "custom", path: ["lat"], message: "latLngPair" });
      }
      if (v.max_guests !== null && !Number.isInteger(v.max_guests)) {
        ctx.addIssue({ code: "custom", path: ["max_guests"], message: "invalidNumber" });
      }
      if (v.use_custom_color && !/^#[0-9a-fA-F]{6}$/.test(v.primary_color)) {
        ctx.addIssue({ code: "custom", path: ["primary_color"], message: "invalidColor" });
      }
      if (v.rsvp_deadline && v.date_time && v.rsvp_deadline > v.date_time) {
        ctx.addIssue({ code: "custom", path: ["rsvp_deadline"], message: "deadlineAfterEvent" });
      }
    })
    .transform((v) => ({
      title: v.title,
      event_type: v.event_type,
      description: v.description,
      date_time: v.date_time as string,
      venue_name: v.venue_name,
      address: v.address,
      lat: v.lat,
      lng: v.lng,
      template_id: v.template_id,
      media_url: v.media_url,
      primary_color: v.use_custom_color ? v.primary_color.toLowerCase() : null,
      gift_link_url: v.gift_link_url,
      rsvp_deadline: v.rsvp_deadline,
      max_guests: v.max_guests,
      is_active: v.is_active === "on",
    }));
}

export type EventFormValues = z.output<ReturnType<typeof eventFormSchema>>;

export const EVENT_FORM_FIELDS = [
  "title",
  "event_type",
  "description",
  "date_time",
  "venue_name",
  "address",
  "lat",
  "lng",
  "template_id",
  "media_url",
  "use_custom_color",
  "primary_color",
  "gift_link_url",
  "rsvp_deadline",
  "max_guests",
  "is_active",
] as const;
