// The only size a virtual background is ever produced at — Google
// Meet/Zoom/Teams all expect a 16:9 1920x1080 image for a custom virtual
// background.
export const VIRTUAL_BACKGROUND_WIDTH_PX = 1920;
export const VIRTUAL_BACKGROUND_HEIGHT_PX = 1080;

export const VIRTUAL_BACKGROUND_IMAGE_MAX_SIZE_BYTES = 8 * 1024 * 1024;
export const VIRTUAL_BACKGROUND_IMAGE_ALLOWED_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'webp',
];
export const VIRTUAL_BACKGROUND_IMAGE_ALLOWED_MIME_TYPE_PATTERN =
  /^image\/(jpeg|png|webp)$/;

// A base image smaller than the target in either dimension is rejected
// outright (upscaling would blur it); one that's equal or larger is
// center-cropped ("cover") down to exactly 1920x1080.
export const VIRTUAL_BACKGROUND_UNDERSIZED_IMAGE_MESSAGE = `Image must be at least ${VIRTUAL_BACKGROUND_WIDTH_PX}x${VIRTUAL_BACKGROUND_HEIGHT_PX}px`;

// QR code square size and the fixed margin from the chosen corner's two
// edges — sized to stay comfortably scannable at typical video-call preview
// resolutions without dominating the frame.
export const VIRTUAL_BACKGROUND_QR_SIZE_PX = 320;
export const VIRTUAL_BACKGROUND_CORNER_MARGIN_PX = 64;

// The QR (and optional caption) sit on a white rounded card for legibility
// over an arbitrary background image — same reasoning as the white card
// EcardShareContent already wraps its own share QR in.
export const VIRTUAL_BACKGROUND_CARD_PADDING_PX = 24;
export const VIRTUAL_BACKGROUND_CARD_CORNER_RADIUS_PX = 24;
export const VIRTUAL_BACKGROUND_CARD_BACKGROUND_COLOR = '#ffffff';

// Vertical gap between the QR code and its optional caption below it.
export const VIRTUAL_BACKGROUND_CAPTION_GAP_PX = 16;
export const VIRTUAL_BACKGROUND_CAPTION_FONT_SIZE_PX = 28;
export const VIRTUAL_BACKGROUND_CAPTION_FONT_FAMILY = 'Arial, sans-serif';
export const VIRTUAL_BACKGROUND_CAPTION_TEXT_COLOR = '#111827';
export const VIRTUAL_BACKGROUND_CAPTION_MAX_LENGTH = 80;
// Rough average glyph-width-to-font-size ratio for the font family above —
// used only to decide whether a caption needs compressing to fit the card's
// width, not for precise layout.
export const VIRTUAL_BACKGROUND_CAPTION_AVG_CHAR_WIDTH_RATIO = 0.55;

export const VIRTUAL_BACKGROUND_STORAGE_KEY_PREFIX = 'virtual-backgrounds';
export const VIRTUAL_BACKGROUND_TEMPLATE_STORAGE_KEY_PREFIX =
  'virtual-background-templates';

export const VIRTUAL_BACKGROUND_TEMPLATE_NAME_MAX_LENGTH = 100;
// A sanity guardrail on the shared template library, not a product-mandated
// limit.
export const VIRTUAL_BACKGROUND_MAX_TEMPLATES = 200;

export const VIRTUAL_BACKGROUND_TEMPLATE_MULTIPART_DATA_FIELD = 'data';
export const VIRTUAL_BACKGROUND_TEMPLATE_IMAGE_FIELD = 'image';
export const VIRTUAL_BACKGROUND_MULTIPART_DATA_FIELD = 'data';
export const VIRTUAL_BACKGROUND_CUSTOM_IMAGE_FIELD = 'customBaseImage';

export const VIRTUAL_BACKGROUND_LIST_DEFAULT_PAGE = 1;
export const VIRTUAL_BACKGROUND_LIST_DEFAULT_PAGE_SIZE = 20;

export const VIRTUAL_BACKGROUND_TEMPLATE_NOT_FOUND_MESSAGE =
  'Virtual background template not found';
export const VIRTUAL_BACKGROUND_TEMPLATE_LIMIT_REACHED_MESSAGE = `The virtual background template library has reached its limit of ${VIRTUAL_BACKGROUND_MAX_TEMPLATES}`;
export const VIRTUAL_BACKGROUND_NOT_FOUND_MESSAGE =
  'Virtual background not found';
export const VIRTUAL_BACKGROUND_MISSING_BASE_IMAGE_MESSAGE =
  'Either a templateId or a custom base image must be provided';
export const VIRTUAL_BACKGROUND_AMBIGUOUS_BASE_IMAGE_MESSAGE =
  'Only one of templateId or a custom base image may be provided';
