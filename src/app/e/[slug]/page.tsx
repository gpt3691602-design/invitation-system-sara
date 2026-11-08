import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { googleCalendarUrl, navigationUrls } from "@/lib/calendar";
import { getPublicEvent } from "@/lib/public-event";
import { invitationUrl } from "@/lib/site";
import { ActionButtons, CalendarButtons } from "@/templates/blocks/ActionButtons";
import { Countdown } from "@/templates/blocks/Countdown";
import { EventInfo } from "@/templates/blocks/EventInfo";
import { templateComponents } from "@/templates/components";
import { defaultTemplateId, isTemplateId } from "@/templates/registry";
import { themeVars } from "@/templates/theme";
import { RegistrationForm } from "./RegistrationForm";

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

  const t = await getTranslations();
  const templateId = isTemplateId(event.template_id) ? event.template_id : defaultTemplateId;
  const Template = templateComponents[templateId];
  const url = await invitationUrl(event.slug);
  const nav = navigationUrls(event.lat, event.lng, event.address);
  const location = [event.venue_name, event.address].filter(Boolean).join(", ") || null;
  const calendarLinks = {
    ics: `/e/${event.slug}/calendar.ics`,
    googleCalendar: googleCalendarUrl({
      slug: event.slug,
      title: event.title,
      description: event.description,
      start: event.date_time,
      location,
      url,
    }),
  };
  let registration: React.ReactNode;
  if (!event.registration_open) {
    registration = <Notice title={t("invite.closedTitle")} body={t("invite.closedBody")} />;
  } else if (event.is_full) {
    registration = <Notice title={t("invite.fullTitle")} body={t("invite.fullBody")} />;
  } else {
    registration = (
      <RegistrationForm
        slug={event.slug}
        calendar={
          <div className="flex flex-wrap justify-center gap-2">
            <CalendarButtons links={calendarLinks} label={t("invite.actions.addToCalendar")} googleLabel={t("invite.actions.googleCalendar")} />
          </div>
        }
      />
    );
  }

  return (
    <div style={themeVars(templateId, event.primary_color)}>
      <Template
        event={event}
        slots={{
          media: event.media_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- any aspect ratio, and GIFs must stay animated
            <img src={event.media_url} alt="" fetchPriority="high" className="block h-auto max-h-[70vh] w-full object-cover" />
          ) : null,
          info: <EventInfo event={event} />,
          description: event.description ? (
            <p className="text-lg leading-relaxed whitespace-pre-line text-balance">{event.description}</p>
          ) : null,
          countdown: event.upcoming ? <Countdown target={event.date_time} /> : null,
          actions: (
            <ActionButtons
              links={{ waze: nav?.waze ?? null, google: nav?.google ?? null, gift: event.gift_link_url, ...calendarLinks }}
            />
          ),
          registration,
          footer: (
            <footer className="mx-auto mt-8 flex max-w-xl justify-center pb-6">
              <LocaleSwitcher />
            </footer>
          ),
        }}
      />
    </div>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div role="status" className="space-y-2 text-center">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="text-[var(--inv-muted)]">{body}</p>
    </div>
  );
}
