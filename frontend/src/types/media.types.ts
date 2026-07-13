export interface ImageFieldValue {
  file: File | null;
  existingMediaId?: string;
  existingUrl?: string;
}

export function emptyImageField(): ImageFieldValue {
  return { file: null };
}
