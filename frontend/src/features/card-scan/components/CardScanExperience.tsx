import { useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { LoaderCircle, X } from "lucide-react";
import { ROUTES } from "@config/routes";
import type { UserDashboardLocationState } from "@features/user-dashboard";
import CameraBlockedNotice from "@features/card-scan/components/CameraBlockedNotice";
import CameraView from "@features/card-scan/components/CameraView";
import CaptureButton from "@features/card-scan/components/CaptureButton";
import ScanToast from "@features/card-scan/components/ScanToast";
import UploadButton from "@features/card-scan/components/UploadButton";
import ViewfinderFrame from "@features/card-scan/components/ViewfinderFrame";
import { useCamera } from "@features/card-scan/hooks/useCamera";
import { useCardScan } from "@features/card-scan/hooks/useCardScan";
import { captureFrame } from "@features/card-scan/utils/captureFrame";

const BACK_STATE: UserDashboardLocationState = { section: "leads" };

/** Full-screen mobile business-card scanner. */
export default function CardScanExperience() {
  const navigate = useNavigate();
  const { scanning, error, scan, dismissError } = useCardScan();
  const { videoRef, ready, blocked, retry } = useCamera(!scanning);
  const capturingRef = useRef(false);

  const close = useCallback(
    () => navigate(ROUTES.userDashboard, { state: BACK_STATE }),
    [navigate],
  );

  const handleCapture = useCallback(async () => {
    if (capturingRef.current || !videoRef.current) return;
    capturingRef.current = true;
    try {
      await scan(await captureFrame(videoRef.current));
    } catch {
      // A frame-grab failure is rare; leave the user on the live view to retry.
    } finally {
      capturingRef.current = false;
    }
  }, [scan, videoRef]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-black text-white">
      <button
        type="button"
        onClick={close}
        aria-label="Close scanner"
        className="absolute left-4 top-4 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>

      {blocked ? (
        <CameraBlockedNotice
          onUpload={scan}
          onRetry={retry}
          disabled={scanning}
        />
      ) : (
        <>
          <div className="absolute inset-0">
            <CameraView videoRef={videoRef} />
          </div>
          <ViewfinderFrame active={scanning} />

          {!ready && !scanning && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3">
              <LoaderCircle className="h-8 w-8 animate-spin" aria-hidden="true" />
              <p className="text-sm text-white/80">Starting camera…</p>
            </div>
          )}

          {scanning && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/60">
              <LoaderCircle
                className="h-9 w-9 animate-spin text-primary"
                aria-hidden="true"
              />
              <p className="text-sm font-medium">Reading card…</p>
            </div>
          )}

          {ready && !scanning && (
            <>
              <p className="absolute inset-x-0 bottom-36 z-10 text-center text-sm text-white/80">
                Fill the frame with the business card
              </p>
              <div className="absolute inset-x-0 bottom-10 z-10 flex items-center justify-center gap-8">
                <UploadButton onSelect={scan} disabled={scanning} />
                <CaptureButton
                  onCapture={() => void handleCapture()}
                  disabled={scanning}
                />
                <span className="h-12 w-12" aria-hidden="true" />
              </div>
            </>
          )}
        </>
      )}

      <ScanToast message={error} onDismiss={dismissError} />
    </div>
  );
}
