import "server-only";
import { headers } from "next/headers";

// Base URL for links that leave the app (the invitation link staff copy).
// NEXT_PUBLIC_SITE_URL wins; otherwise the host of the current request.
export async function getSiteUrl(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function invitationUrl(slug: string): Promise<string> {
  return `${await getSiteUrl()}/e/${slug}`;
}
