export const ECARD_MULTIPART_DATA_FIELD = "data";
export const ECARD_HERO_PHOTO_FIELD = "heroProfilePhoto";

export function ecardGalleryImageField(
  subGalleryIndex: number,
  imageIndex: number,
): string {
  return `galleryImage_${subGalleryIndex}_${imageIndex}`;
}
