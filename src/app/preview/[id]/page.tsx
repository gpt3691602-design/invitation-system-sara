import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { InvitationView, Notice } from "@/components/InvitationView";
import { requireStaff } from "@/lib/auth";
import { withUpcoming } from "@/lib/public-event";
import { invitationUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { robots: { index: false } };

// Staff preview of an invitation, including inactive events and drafts.
// Outside /admin so the admin header does not wrap the template. The live
// registration form is replaced by a notice, so previews never create data.
export default async function PreviewPage({ params }: PageProps<"/preview/[id]">) {
  await requireStaff();
  const { id } = await params;
  const t = await getTranslations("preview");
  const supabase = await createClient();
  const { data: e } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (!e) notFound();

  const event = withUpcoming({
    slug: e.slug,
    title: e.title,
    event_type: e.event_type,
    description: e.description,
    date_time: e.date_time,
    venue_name: e.venue_name,
    address: e.address,
    lat: e.lat,
    lng: e.lng,
    template_id: e.template_id,
    media_url: e.media_url,
    video_url: e.video_url,
    primary_color: e.primary_color,
    gift_link_url: e.gift_link_url,
    rsvp_deadline: e.rsvp_deadline,
    registration_open: true,
    is_full: false,
    seating_open: false,
    updated_at: e.updated_at,
  });

  return (
    <>
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-center gap-3 bg-amber-300 px-4 py-2 text-sm text-amber-950">
        <span className="font-semibold">{t("banner")}</span>
        {!e.is_active && <span>{t("inactive")}</span>}
        <Link href={`/admin/events/${e.id}`} className="underline underline-offset-2">
          {t("back")}
        </Link>
      </div>
      <InvitationView
        event={event}
        url={await invitationUrl(e.slug)}
        registrationOverride={<Notice title={t("formTitle")} body={t("formBody")} />}
      />
    </>
  );
}
