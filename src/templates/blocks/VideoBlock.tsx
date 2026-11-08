import { getTranslations } from "next-intl/server";
import { qrDataUri } from "@/lib/qr";

// The event's video, playable in place, plus a QR code that opens it. The QR
// is for people who see the invitation on a computer or a printout; on the
// phone itself the player does the job.
export async function VideoBlock({ url }: { url: string }) {
  const t = await getTranslations("invite.video");
  const qr = await qrDataUri(url);
  return (
    <section aria-label={t("title")} className="space-y-4">
      <h2 className="text-xl font-bold">{t("title")}</h2>
      <video
        src={url}
        controls
        playsInline
        preload="metadata"
        className="mx-auto block max-h-[70vh] w-full max-w-sm rounded-2xl border border-[var(--inv-border)] bg-black"
      />
      <figure className="mx-auto flex w-fit items-center gap-3 rounded-2xl border border-[var(--inv-border)] bg-[var(--inv-surface)] p-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- inline SVG data URI */}
        <img src={qr} alt={t("qrAlt")} width={112} height={112} className="rounded-lg bg-white" />
        <figcaption className="max-w-32 text-start text-sm text-[var(--inv-muted)]">{t("qr")}</figcaption>
      </figure>
    </section>
  );
}
