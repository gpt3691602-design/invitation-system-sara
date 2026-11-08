import { buildIcs } from "@/lib/calendar";
import { getPublicEvent } from "@/lib/public-event";
import { getSiteUrl } from "@/lib/site";

export async function GET(_req: Request, ctx: RouteContext<"/e/[slug]/calendar.ics">) {
  const { slug } = await ctx.params;
  const event = await getPublicEvent(slug);
  if (!event) return new Response("Not found", { status: 404 });

  const site = await getSiteUrl();
  const ics = buildIcs(
    {
      slug: event.slug,
      title: event.title,
      description: event.description,
      start: event.date_time,
      location: [event.venue_name, event.address].filter(Boolean).join(", ") || null,
      url: `${site}/e/${event.slug}`,
    },
    new URL(site).host,
  );

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
