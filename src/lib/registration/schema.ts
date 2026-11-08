import { z } from "zod";
import { normalizePhone } from "@/lib/phone";

export const MAX_GUESTS_PER_REGISTRATION = 20;

// Error messages are translation keys under "registration.errors".
export const registrationSchema = z
  .object({
    full_name: z.string().trim().min(2, { message: "nameRequired" }).max(120, { message: "tooLong" }),
    phone: z.string().transform((v, ctx) => {
      const e164 = normalizePhone(v);
      if (!e164) {
        ctx.addIssue({ code: "custom", message: v.trim() ? "phoneInvalid" : "phoneRequired" });
        return z.NEVER;
      }
      return e164;
    }),
    email: z
      .string()
      .trim()
      .max(254, { message: "tooLong" })
      .transform((v, ctx) => {
        if (v === "") return null;
        if (!z.email().safeParse(v).success) {
          ctx.addIssue({ code: "custom", message: "emailInvalid" });
          return z.NEVER;
        }
        return v.toLowerCase();
      }),
    guest_count: z.coerce
      .number({ message: "countInvalid" })
      .int({ message: "countInvalid" })
      .min(1, { message: "countInvalid" })
      .max(MAX_GUESTS_PER_REGISTRATION, { message: "countTooHigh" }),
    // Names of the other attendees (the registrant is attendee #1).
    companions: z.array(z.string().trim().max(120, { message: "tooLong" })),
    notes: z
      .string()
      .trim()
      .max(1000, { message: "tooLong" })
      .transform((v) => (v === "" ? null : v)),
  })
  .transform((v) => ({
    full_name: v.full_name,
    phone: v.phone,
    email: v.email,
    guest_count: v.guest_count,
    guest_names: [v.full_name, ...v.companions.slice(0, v.guest_count - 1).filter(Boolean)],
    notes: v.notes,
  }));

export type RegistrationInput = z.output<typeof registrationSchema>;
