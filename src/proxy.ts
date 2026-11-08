import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Only routes that need the staff session. The public invitation pages
  // (/e/...) stay out of the proxy so they never wait on an auth call.
  matcher: ["/admin/:path*", "/login"],
};
