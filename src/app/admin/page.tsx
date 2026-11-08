import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

// Placeholder for stage 0. Stage 1 adds login, the /admin guard and the event list.
export default async function AdminPage() {
  const t = await getTranslations();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("admin.title")}</h1>
        <LocaleSwitcher />
      </header>
      <p className="mt-6 text-muted">{t("admin.comingSoon")}</p>
    </main>
  );
}
