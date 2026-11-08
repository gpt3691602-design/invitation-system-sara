import { getTranslations } from "next-intl/server";

export default async function InvitationNotFound() {
  const t = await getTranslations("invite");
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center px-4 text-center">
      <div className="max-w-sm space-y-3">
        <p className="text-5xl" aria-hidden>
          💌
        </p>
        <h1 className="text-2xl font-bold">{t("notFoundTitle")}</h1>
        <p className="text-gray-600">{t("notFoundBody")}</p>
      </div>
    </main>
  );
}
