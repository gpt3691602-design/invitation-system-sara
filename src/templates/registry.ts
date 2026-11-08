// The 10 invitation templates from the work plan. Stage 1 only needs their
// identity and palette for the picker; the page components arrive in stage 2
// (first three) and stage 5 (the rest).
export type TemplateId =
  | "classic"
  | "minimal"
  | "floral"
  | "midnight"
  | "gold"
  | "kids"
  | "corporate"
  | "tech"
  | "festive"
  | "romantic";

export type TemplateMeta = {
  id: TemplateId;
  // Background, text and accent colors for the swatch and the default theme.
  palette: { bg: string; fg: string; accent: string };
};

export const templates: readonly TemplateMeta[] = [
  { id: "classic", palette: { bg: "#faf7f2", fg: "#2b2b2b", accent: "#8b6f47" } },
  { id: "minimal", palette: { bg: "#ffffff", fg: "#111111", accent: "#111111" } },
  { id: "floral", palette: { bg: "#fdf3f4", fg: "#4a2c33", accent: "#c76b7e" } },
  { id: "midnight", palette: { bg: "#0f172a", fg: "#e2e8f0", accent: "#38bdf8" } },
  { id: "gold", palette: { bg: "#1c1917", fg: "#f5f0e6", accent: "#d4a537" } },
  { id: "kids", palette: { bg: "#fff8e1", fg: "#1f2937", accent: "#f97316" } },
  { id: "corporate", palette: { bg: "#f8fafc", fg: "#0f172a", accent: "#1d4ed8" } },
  { id: "tech", palette: { bg: "#0b0f14", fg: "#d1fae5", accent: "#10b981" } },
  { id: "festive", palette: { bg: "#fef2f2", fg: "#3f1d1d", accent: "#dc2626" } },
  { id: "romantic", palette: { bg: "#fbf4f9", fg: "#3b1f3a", accent: "#a855a0" } },
];

export const templateIds = templates.map((t) => t.id) as [TemplateId, ...TemplateId[]];
export const defaultTemplateId: TemplateId = "classic";

export function isTemplateId(value: unknown): value is TemplateId {
  return typeof value === "string" && (templateIds as readonly string[]).includes(value);
}
