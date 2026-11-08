import type { ComponentType } from "react";
import type { TemplateId } from "./registry";
import type { TemplateProps } from "./types";
import { ClassicTemplate } from "./classic/Template";
import { CorporateTemplate } from "./corporate/Template";
import { FestiveTemplate } from "./festive/Template";
import { FloralTemplate } from "./floral/Template";
import { GoldTemplate } from "./gold/Template";
import { KidsTemplate } from "./kids/Template";
import { MidnightTemplate } from "./midnight/Template";
import { MinimalTemplate } from "./minimal/Template";
import { RomanticTemplate } from "./romantic/Template";
import { TechTemplate } from "./tech/Template";

export const templateComponents: Record<TemplateId, ComponentType<TemplateProps>> = {
  classic: ClassicTemplate,
  minimal: MinimalTemplate,
  floral: FloralTemplate,
  midnight: MidnightTemplate,
  gold: GoldTemplate,
  kids: KidsTemplate,
  corporate: CorporateTemplate,
  tech: TechTemplate,
  festive: FestiveTemplate,
  romantic: RomanticTemplate,
};
