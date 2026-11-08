import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvitationView } from "@/components/InvitationView";
import { getPublicEvent } from "@/lib/public-event";
import { invitationUrl } from "@/lib/site";

export async function generateMetadata({ params }: PageProps<"/e/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublicEvent(slug);
  if (!event) return { robots: { index: false } };
  const description = event.description?.slice(0, 200) ?? event.venue_name ?? undefined;
  return {
    title: event.title,
    description,
    // Guest lists are private: keep invitations out of search engines.
    robots: { index: false, follow: false },
    // The preview WhatsApp shows when the link is pasted into a chat.
    openGraph: {
      title: event.title,
      description,
      type: "website",
      url: await invitationUrl(event.slug),
      images: event.media_url ? [{ url: event.media_url }] : undefined,
    },
  };
}

export default async function InvitationPage({ params }: PageProps<"/e/[slug]">) {
  const { slug } = await params;
  const event = await getPublicEvent(slug);
  if (!event) notFound();
  return <InvitationView event={event} url={await invitationUrl(event.slug)} />;
}
