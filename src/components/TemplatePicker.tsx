"use client";

import { useTranslations } from "next-intl";
import { templates, type TemplateId } from "@/templates/registry";

export function TemplatePicker({
  value,
  onChange,
}: {
  value: TemplateId;
  onChange: (id: TemplateId) => void;
}) {
  const t = useTranslations("templates");

  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-medium text-gray-900">{t("legend")}</legend>
      <input type="hidden" name="template_id" value={value} />
      <div role="radiogroup" className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {templates.map((tpl) => {
          const selected = tpl.id === value;
          return (
            <button
              key={tpl.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(tpl.id)}
              className={
                "group rounded-xl border p-2 text-start transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 " +
                (selected ? "border-gray-900 ring-2 ring-gray-900" : "border-gray-200 hover:border-gray-400")
              }
            >
              <span
                className="flex h-16 flex-col items-center justify-center gap-1 rounded-lg"
                style={{ background: tpl.palette.bg, color: tpl.palette.fg }}
                aria-hidden
              >
                <span className="text-xs font-semibold">Aa</span>
                <span className="h-1.5 w-8 rounded-full" style={{ background: tpl.palette.accent }} />
              </span>
              <span className="mt-1.5 block text-sm">{t(tpl.id)}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
