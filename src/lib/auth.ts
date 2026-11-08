import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type StaffUser = { id: string; email: string | null; displayName: string | null };

// Signed-in user who is on the staff list, or null. Cached per request.
export const getStaffUser = cache(async (): Promise<StaffUser | null> => {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return null;

  // RLS lets only staff read the staff table, so a row here proves membership.
  const { data: staff } = await supabase
    .from("staff")
    .select("user_id, display_name")
    .eq("user_id", userId)
    .maybeSingle();
  if (!staff) return null;

  return {
    id: userId,
    email: (claimsData.claims.email as string | undefined) ?? null,
    displayName: staff.display_name,
  };
});

export async function isSignedIn(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return Boolean(data?.claims?.sub);
}

// For admin pages: signed out goes to /login, signed in without staff
// membership goes to /no-access.
export async function requireStaff(): Promise<StaffUser> {
  const user = await getStaffUser();
  if (user) return user;
  redirect((await isSignedIn()) ? "/no-access" : "/login");
}
