import { getTranslations } from "next-intl/server";
import { qrDataUri } from "@/lib/qr";

// The event's video is reached only through its QR code: scanned from a
// printed invitation or another screen, or tapped on the phone showing the
// invitation (a QR cannot be scanned from the screen it is on).
export async function VideoBlock({ url }: { url: string }) {
  const t = await getTranslations("invite.video");
  const qr = await qrDataUri(url);
  return (
    <section aria-labelledby="video-qr-title" className="space-y-3">
      <h2 id="video-qr-title" className="text-xl font-bold">{t("title")}</h2>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mx-auto block w-fit rounded-2xl border border-[var(--inv-border)] bg-[var(--inv-surface)] p-3 transition-transform hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--inv-accent)]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- inline SVG data URI */}
        <img src={qr} alt={t("qrAlt")} width={168} height={168} className="mx-auto rounded-lg bg-white" />
        <span className="mt-2 block text-sm text-[var(--inv-muted)]">{t("qr")}</span>
      </a>
    </section>
  );
}
