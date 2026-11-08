import { z } from "zod";
import { normalizePhone } from "@/lib/phone";

// Staff add or edit a registration by hand. Looser than the guest form:
// staff may record up to 50 guests and set the status.
// Error messages are translation keys under "registrationForm.errors".
export const staffRegistrationSchema = z
  .object({
    full_name: z.string().trim().min(1, { message: "required" }).max(120, { message: "tooLong" }),
    phone: z.string().transform((v, ctx) => {
      const e164 = normalizePhone(v);
      if (!e164) {
        ctx.addIssue({ code: "custom", message: v.trim() ? "phoneInvalid" : "required" });
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
      .max(50, { message: "countInvalid" }),
    // One attendee name per line.
    guest_names: z.string().transform((v) =>
      v
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => s.slice(0, 120)),
    ),
    notes: z
      .string()
      .trim()
      .max(1000, { message: "tooLong" })
      .transform((v) => (v === "" ? null : v)),
    status: z.enum(["confirmed", "cancelled"]),
  })
  .superRefine((v, ctx) => {
    if (v.guest_names.length > v.guest_count) {
      ctx.addIssue({ code: "custom", path: ["guest_names"], message: "tooManyNames" });
    }
  });

export type StaffRegistrationInput = z.output<typeof staffRegistrationSchema>;

export function parseStaffRegistration(formData: FormData) {
  return staffRegistrationSchema.safeParse({
    full_name: formData.get("full_name") ?? "",
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? "",
    guest_count: formData.get("guest_count") ?? "1",
    guest_names: formData.get("guest_names") ?? "",
    notes: formData.get("notes") ?? "",
    status: formData.get("status") ?? "confirmed",
  });
}
