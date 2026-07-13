import imageCompression from "browser-image-compression";
import {
  IMAGE_COMPRESSION_INITIAL_QUALITY,
  IMAGE_COMPRESSION_MAX_SIZE_MB,
  IMAGE_COMPRESSION_MAX_WIDTH_OR_HEIGHT,
} from "@config/media.config";

/** Applied on every upload path (cropped and skip-crop alike) so no image
 * reaches the server uncompressed. Falls back to the original file if
 * compression fails rather than blocking the upload.
 *
 * browser-image-compression returns a plain Blob with a `.name` property
 * patched on, not a real File — FormData ignores that property and sends
 * the part as filename "blob" (no extension), which the backend's
 * extension check then rejects. Re-wrap it in an actual File to fix that. */
export async function compressImage(file: File): Promise<File> {
  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: IMAGE_COMPRESSION_MAX_SIZE_MB,
      maxWidthOrHeight: IMAGE_COMPRESSION_MAX_WIDTH_OR_HEIGHT,
      initialQuality: IMAGE_COMPRESSION_INITIAL_QUALITY,
      useWebWorker: true,
    });
    return new File([compressed], file.name, { type: compressed.type });
  } catch {
    return file;
  }
}
