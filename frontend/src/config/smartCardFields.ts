export const SMART_CARD_MULTIPART_DATA_FIELD = "data";
export const SMART_CARD_PROFILE_LOGO_FIELD = "profileLogo";
export const SMART_CARD_FOUNDER_IMAGE_FIELD = "founderImage";

export function smartCardServiceImageField(index: number): string {
  return `serviceImage_${index}`;
}

export function smartCardGalleryImageField(
  galleryIndex: number,
  imageIndex: number,
): string {
  return `galleryImage_${galleryIndex}_${imageIndex}`;
}
