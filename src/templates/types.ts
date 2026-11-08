import type { ReactNode } from "react";
import type { PublicEvent } from "@/lib/public-event";

// Every template receives the event and ready-made blocks, and decides only
// layout and look. Blocks read the theme from CSS variables (--inv-*), so
// one block works in every template.
export type TemplateSlots = {
  media: ReactNode | null;
  info: ReactNode;
  description: ReactNode | null;
  countdown: ReactNode | null;
  actions: ReactNode;
  registration: ReactNode;
  footer: ReactNode;
};

export type TemplateProps = {
  event: PublicEvent;
  slots: TemplateSlots;
};
