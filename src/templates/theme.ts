import type { CSSProperties } from "react";
import { templates, type TemplateId } from "./registry";

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Black or white text, whichever reads better on the given color.
export function readableOn(hex: string): string {
  return luminance(hex) > 0.4 ? "#111111" : "#ffffff";
}

export function isDark(hex: string): boolean {
  return luminance(hex) < 0.2;
}

// CSS variables for a template, with the event's custom color (if any)
// replacing the template accent.
export function themeVars(templateId: TemplateId, primaryColor: string | null): CSSProperties {
  const palette = templates.find((t) => t.id === templateId)?.palette ?? templates[0].palette;
  const accent = primaryColor ?? palette.accent;
  const dark = isDark(palette.bg);
  return {
    "--inv-bg": palette.bg,
    "--inv-fg": palette.fg,
    "--inv-accent": accent,
    "--inv-on-accent": readableOn(accent),
    "--inv-muted": dark ? "rgb(255 255 255 / 0.65)" : "rgb(0 0 0 / 0.6)",
    "--inv-surface": dark ? "rgb(255 255 255 / 0.06)" : "#ffffff",
    "--inv-border": dark ? "rgb(255 255 255 / 0.18)" : "rgb(0 0 0 / 0.14)",
    "--inv-input-bg": dark ? "rgb(255 255 255 / 0.08)" : "#ffffff",
  } as CSSProperties;
}
