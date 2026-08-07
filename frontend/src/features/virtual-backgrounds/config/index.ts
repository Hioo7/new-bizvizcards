// Mirrors backend/src/modules/virtual-backgrounds/virtual-backgrounds.constants.ts
// — frontend/backend constants aren't shared across the repo.
export const VIRTUAL_BACKGROUND_WIDTH_PX = 1920;
export const VIRTUAL_BACKGROUND_HEIGHT_PX = 1080;
export const VIRTUAL_BACKGROUND_CAPTION_MAX_LENGTH = 80;

export const VIRTUAL_BACKGROUND_TEMPLATE_NAME_MAX_LENGTH = 100;

export const VIRTUAL_BACKGROUND_MULTIPART_DATA_FIELD = "data";
export const VIRTUAL_BACKGROUND_CUSTOM_IMAGE_FIELD = "customBaseImage";
export const VIRTUAL_BACKGROUND_TEMPLATE_IMAGE_FIELD = "image";

export const VIRTUAL_BACKGROUND_QR_CORNERS = [
  "TOP_LEFT",
  "TOP_RIGHT",
  "BOTTOM_LEFT",
  "BOTTOM_RIGHT",
] as const;

export const VIRTUAL_BACKGROUND_QR_CORNER_LABELS: Record<
  (typeof VIRTUAL_BACKGROUND_QR_CORNERS)[number],
  string
> = {
  TOP_LEFT: "Top left",
  TOP_RIGHT: "Top right",
  BOTTOM_LEFT: "Bottom left",
  BOTTOM_RIGHT: "Bottom right",
};

export const VIRTUAL_BACKGROUND_BUILDER_STEPS = [
  { id: "base-image", label: "Background" },
  { id: "corner-caption", label: "QR Placement" },
  { id: "preview", label: "Preview" },
] as const;
