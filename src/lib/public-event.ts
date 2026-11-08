import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import type { Database } from "@/lib/types/database";

type PublicEventRow = Database["public"]["Functions"]["get_public_event"]["Returns"][number];
export type PublicEvent = PublicEventRow & { upcoming: boolean };

// One database call per request, shared by generateMetadata and the page.
export const getPublicEvent = cache(async (slug: string): Promise<PublicEvent | null> => {
  if (!/^[a-z0-9-]{3,80}$/.test(slug)) return null;
  const { data, error } = await createPublicClient().rpc("get_public_event", { p_slug: slug });
  if (error) {
    console.error("get_public_event failed", error);
    throw new Error("Could not load event");
  }
  const row = data?.[0];
  if (!row) return null;
  // Resolved here, at fetch time, so rendering stays free of clock reads.
  return { ...row, upcoming: new Date(row.date_time).getTime() > Date.now() };
});
