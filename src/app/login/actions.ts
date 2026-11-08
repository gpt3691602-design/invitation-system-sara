"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// email is echoed back so the field survives the automatic form reset.
export type LoginState = { error?: "invalid" | "failed"; email?: string };

// Only same-site admin paths, so ?next= cannot bounce users to another site.
function safeNext(value: FormDataEntryValue | null): string {
  if (typeof value === "string" && /^\/admin(\/[\w\-/]*)?$/.test(value)) return value;
  return "/admin";
}

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "invalid", email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Wrong email and wrong password look the same, on purpose.
    return { error: error.status === 400 ? "invalid" : "failed", email };
  }
  redirect(safeNext(formData.get("next")));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
