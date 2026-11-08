"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

export function CopyLinkButton({ url }: { url: string }) {
  const t = useTranslations("admin");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
        } catch {
          // Clipboard blocked (old browser, insecure context): let the user copy by hand.
          window.prompt(t("copyLink"), url);
        }
      }}
    >
      <span aria-live="polite">{copied ? t("copied") : t("copyLink")}</span>
    </Button>
  );
}
