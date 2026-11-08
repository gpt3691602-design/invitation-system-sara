import { createBrowserClient } from "@supabase/ssr";

// Client Components. Uses the publishable key, so RLS applies.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
