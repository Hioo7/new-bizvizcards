import {
  CARD_SCAN_CAPTURE_FILENAME,
  CARD_SCAN_CAPTURE_QUALITY,
  CARD_SCAN_CAPTURE_TYPE,
} from "@features/card-scan/config";

/**
 * Grabs the current frame from a playing `<video>` element as a JPEG File.
 * The canvas draw bakes in the device orientation, so no EXIF handling is
 * needed on this path.
 */
export async function captureFrame(video: HTMLVideoElement): Promise<File> {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) {
    throw new Error("Camera is not ready yet.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not capture the frame.");
  }
  ctx.drawImage(video, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, CARD_SCAN_CAPTURE_TYPE, CARD_SCAN_CAPTURE_QUALITY);
  });
  if (!blob) {
    throw new Error("Could not capture the frame.");
  }
  return new File([blob], CARD_SCAN_CAPTURE_FILENAME, {
    type: CARD_SCAN_CAPTURE_TYPE,
  });
}
