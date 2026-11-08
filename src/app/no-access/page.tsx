import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { signOut } from "@/app/login/actions";
import { Button } from "@/components/ui/Button";
import { getStaffUser, isSignedIn } from "@/lib/auth";

export default async function NoAccessPage() {
  if (await getStaffUser()) redirect("/admin");
  if (!(await isSignedIn())) redirect("/login");
  const t = await getTranslations("noAccess");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-gray-600">{t("body")}</p>
        <form action={signOut}>
          <Button type="submit" variant="secondary">{t("signOut")}</Button>
        </form>
      </div>
    </main>
  );
}
