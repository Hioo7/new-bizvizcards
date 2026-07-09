import { Handshake, QrCode } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { SmartCardTemplateKey } from "@app-types/smartCard";

export type SmartCardTemplateColor = "primary" | "secondary";

export interface SmartCardTemplateDefinition {
  key: SmartCardTemplateKey;
  name: string;
  description: string;
  color: SmartCardTemplateColor;
  featureIcons: LucideIcon[];
}

export const SMART_CARD_TEMPLATES: SmartCardTemplateDefinition[] = [
  {
    key: "INTERIOR_DESIGN_TEMPLATE",
    name: "Interior Design",
    description:
      "A clean interior-design mini website with services, gallery and founder story. Reachable by QR.",
    color: "primary",
    featureIcons: [QrCode],
  },
  {
    key: "INTERIOR_DESIGN_TEMPLATE_2",
    name: "Interior Design + Exchange Contact",
    description:
      "Same interior-design layout, linked to a customer, with a QR-ready popup that lets visitors exchange contact details.",
    color: "secondary",
    featureIcons: [QrCode, Handshake],
  },
];
