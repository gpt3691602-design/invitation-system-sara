import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { FindTable } from "@/app/e/[slug]/FindTable";
import { RegistrationForm } from "@/app/e/[slug]/RegistrationForm";
import { googleCalendarUrl, navigationUrls } from "@/lib/calendar";
import type { PublicEvent } from "@/lib/public-event";
import { ActionButtons, CalendarButtons } from "@/templates/blocks/ActionButtons";
import { Countdown } from "@/templates/blocks/Countdown";
import { EventInfo } from "@/templates/blocks/EventInfo";
import { VideoBlock } from "@/templates/blocks/VideoBlock";
import { templateComponents } from "@/templates/components";
import { defaultTemplateId, isTemplateId } from "@/templates/registry";
import { themeVars } from "@/templates/theme";

// The invitation as guests see it. Used by the public page and by the staff
// preview, which passes its own registration block (no live form).
export async function InvitationView({
  event,
  url,
  registrationOverride,
}: {
  event: PublicEvent;
  url: string;
  registrationOverride?: ReactNode;
}) {
  const t = await getTranslations();
  const templateId = isTemplateId(event.template_id) ? event.template_id : defaultTemplateId;
  const Template = templateComponents[templateId];
  const nav = navigationUrls(event.lat, event.lng, event.address);
  const location = [event.venue_name, event.address].filter(Boolean).join(", ") || null;
  const calendarLinks = {
    ics: `/e/${event.slug}/calendar.ics`,
    googleCalendar: googleCalendarUrl({ slug: event.slug, title: event.title, description: event.description, start: event.date_time, location, url }),
  };

  let registration: ReactNode = registrationOverride;
  if (registration === undefined) {
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
          // On the event day the table lookup sits right above the details,
          // so nobody has to scroll for it at the venue entrance.
          info: event.seating_open ? (
            <div className="space-y-8">
              <FindTable slug={event.slug} />
              <EventInfo event={event} />
            </div>
          ) : (
            <EventInfo event={event} />
          ),
          description: event.description ? (
            <p className="text-lg leading-relaxed whitespace-pre-line text-balance">{event.description}</p>
          ) : null,
          countdown: event.upcoming ? <Countdown target={event.date_time} /> : null,
          actions: (
            <>
              {event.video_url && <VideoBlock url={event.video_url} />}
              <ActionButtons links={{ waze: nav?.waze ?? null, google: nav?.google ?? null, gift: event.gift_link_url, ...calendarLinks }} />
            </>
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

export function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div role="status" className="space-y-2 text-center">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="text-[var(--inv-muted)]">{body}</p>
    </div>
  );
}
