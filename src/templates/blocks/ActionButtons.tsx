import { getTranslations } from "next-intl/server";

const button =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--inv-border)] bg-[var(--inv-surface)] px-4 text-sm font-medium " +
  "transition-colors hover:border-[var(--inv-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--inv-accent)]";

export type ActionLinks = {
  waze: string | null;
  google: string | null;
  ics: string;
  googleCalendar: string;
  gift: string | null;
};

export async function ActionButtons({ links }: { links: ActionLinks }) {
  const t = await getTranslations("invite.actions");
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {links.waze && (
        <a href={links.waze} target="_blank" rel="noopener noreferrer" className={button}>
          {t("waze")}
        </a>
      )}
      {links.google && (
        <a href={links.google} target="_blank" rel="noopener noreferrer" className={button}>
          {t("googleMaps")}
        </a>
      )}
      <CalendarButtons links={links} label={t("addToCalendar")} googleLabel={t("googleCalendar")} />
      {links.gift && (
        <a href={links.gift} target="_blank" rel="noopener noreferrer" className={button}>
          {t("gift")}
        </a>
      )}
    </div>
  );
}

// Also shown on the thank-you screen.
export function CalendarButtons({ links, label, googleLabel }: { links: Pick<ActionLinks, "ics" | "googleCalendar">; label: string; googleLabel: string }) {
  return (
    <>
      <a href={links.ics} className={button}>
        {label}
      </a>
      <a href={links.googleCalendar} target="_blank" rel="noopener noreferrer" className={button}>
        {googleLabel}
      </a>
    </>
  );
}
