import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { hasSupabaseEnv } from "@/lib/env";

// Liveness check for the deployment and the Supabase connection.
// An anonymous select on events returns zero rows under RLS but no error,
// which proves the URL, the key and the schema are all in place.
export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ ok: false, supabase: "missing env" }, { status: 503 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } },
  );
  const { error } = await supabase.from("events").select("id", { head: true, count: "exact" });

  return NextResponse.json(
    { ok: !error, supabase: error ? error.message : "connected" },
    { status: error ? 503 : 200, headers: { "Cache-Control": "no-store" } },
  );
}
