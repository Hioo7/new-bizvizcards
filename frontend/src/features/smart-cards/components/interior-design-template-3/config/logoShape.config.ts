import type { SmartCardLogoShape } from "@app-types/smartCard";

export const SMART_CARD_DEFAULT_LOGO_SHAPE: SmartCardLogoShape = "CIRCLE";

export const SMART_CARD_LOGO_SHAPE_OPTIONS: {
  value: SmartCardLogoShape;
  label: string;
}[] = [
  { value: "CIRCLE", label: "Circle" },
  { value: "RECTANGLE", label: "Rectangle" },
  { value: "FREEFORM", label: "Freeform" },
];
