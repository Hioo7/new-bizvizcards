import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@config/routes";
import { ApiError } from "@services/apiClient";
import { compressImage } from "@components/media/compressImage";
import type { UserDashboardLocationState } from "@features/user-dashboard";
import {
  SCAN_ERROR_FALLBACK,
  SCAN_ERROR_MESSAGES,
} from "@features/card-scan/config";
import { scanCard } from "@features/card-scan/services/cardScanService";
import { mapExtractionToLead } from "@features/card-scan/utils/mapExtractionToLead";

interface UseCardScanResult {
  scanning: boolean;
  error: string | null;
  scan: (image: File) => Promise<void>;
  dismissError: () => void;
}

/** Runs a captured/uploaded image through the OCR service, then routes to the
 *  Leads tab with the extracted fields as New Lead form prefill. */
export function useCardScan(): UseCardScanResult {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dismissError = useCallback(() => setError(null), []);

  const scan = useCallback(
    async (image: File) => {
      setScanning(true);
      setError(null);
      try {
        const result = await scanCard(await compressImage(image));

        const state: UserDashboardLocationState = {
          section: "leads",
          scanPrefill: {
            key: Date.now(),
            initialValues: mapExtractionToLead(result.contact),
            rawText: result.contact.raw_text,
          },
        };
        navigate(ROUTES.userDashboard, { state });
      } catch (err) {
        setError(resolveMessage(err));
        setScanning(false);
      }
    },
    [navigate],
  );

  return { scanning, error, scan, dismissError };
}

function resolveMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return SCAN_ERROR_MESSAGES[err.status] ?? err.message ?? SCAN_ERROR_FALLBACK;
  }
  return err instanceof Error && err.message ? err.message : SCAN_ERROR_FALLBACK;
}
