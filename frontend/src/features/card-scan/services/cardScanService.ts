import { SCANNER_BASE_PATH } from "@config/api";
import { apiRequest } from "@services/apiClient";
import { CARD_SCAN_CAPTURE_FILENAME } from "@features/card-scan/config";
import type { CardExtractionResult } from "@features/card-scan/types";

/** Sends a card image to the OCR service and returns the extracted fields. */
export function scanCard(image: Blob): Promise<CardExtractionResult> {
  const form = new FormData();
  form.append("file", image, CARD_SCAN_CAPTURE_FILENAME);
  return apiRequest<CardExtractionResult>(`${SCANNER_BASE_PATH}/extract`, {
    method: "POST",
    body: form,
  });
}
