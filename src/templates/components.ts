import type { ComponentType } from "react";
import type { TemplateId } from "./registry";
import type { TemplateProps } from "./types";
import { ClassicTemplate } from "./classic/Template";
import { KidsTemplate } from "./kids/Template";
import { MidnightTemplate } from "./midnight/Template";

// Stage 2 ships three layouts to validate the template contract. Until
// stage 5, the other seven reuse the closest layout with their own palette,
// so an event set to any template still renders correctly.
export const templateComponents: Record<TemplateId, ComponentType<TemplateProps>> = {
  classic: ClassicTemplate,
  minimal: ClassicTemplate,
  floral: ClassicTemplate,
  midnight: MidnightTemplate,
  gold: MidnightTemplate,
  kids: KidsTemplate,
  corporate: ClassicTemplate,
  tech: MidnightTemplate,
  festive: KidsTemplate,
  romantic: ClassicTemplate,
};
