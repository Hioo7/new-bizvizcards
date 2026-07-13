import imageCompression from "browser-image-compression";
import {
  IMAGE_COMPRESSION_INITIAL_QUALITY,
  IMAGE_COMPRESSION_MAX_SIZE_MB,
  IMAGE_COMPRESSION_MAX_WIDTH_OR_HEIGHT,
} from "@config/media.config";

/** Applied on every upload path (cropped and skip-crop alike) so no image
 * reaches the server uncompressed. Falls back to the original file if
 * compression fails rather than blocking the upload. */
export async function compressImage(file: File): Promise<File> {
  try {
    return await imageCompression(file, {
      maxSizeMB: IMAGE_COMPRESSION_MAX_SIZE_MB,
      maxWidthOrHeight: IMAGE_COMPRESSION_MAX_WIDTH_OR_HEIGHT,
      initialQuality: IMAGE_COMPRESSION_INITIAL_QUALITY,
      useWebWorker: true,
    });
  } catch {
    return file;
  }
}
