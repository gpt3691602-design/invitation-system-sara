import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { LoginForm } from "./LoginForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("login");
  return { title: t("title"), robots: { index: false } };
}

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const t = await getTranslations();
  const { next } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t("login.title")}</h1>
          <LocaleSwitcher />
        </div>
        <p className="text-gray-600">{t("app.name")}</p>
        <LoginForm next={typeof next === "string" ? next : "/admin"} />
      </div>
    </main>
  );
}
