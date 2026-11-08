import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { signOut } from "@/app/login/actions";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { Button } from "@/components/ui/Button";
import { requireStaff } from "@/lib/auth";

export const metadata: Metadata = { robots: { index: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireStaff();
  const t = await getTranslations();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/admin" className="text-lg font-bold">
            {t("app.name")}
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-gray-600 sm:inline">{user.displayName ?? user.email}</span>
            <LocaleSwitcher />
            <form action={signOut}>
              <Button type="submit" variant="ghost">{t("admin.signOut")}</Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
