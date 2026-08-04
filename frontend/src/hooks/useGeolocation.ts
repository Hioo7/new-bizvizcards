import { useCallback, useState } from "react";
import { GEOLOCATION_DEFAULT_TIMEOUT_MS } from "@config/geolocation.config";

export interface GeolocationCoords {
  latitude: number;
  longitude: number;
}

export type GeolocationCaptureError = "unsupported" | "denied" | "unavailable";

export interface UseGeolocationResult {
  coords: GeolocationCoords | null;
  isLocating: boolean;
  error: GeolocationCaptureError | null;
  /** Captures the current position. Also reachable declaratively via `coords`. */
  capture: (onSuccess?: (coords: GeolocationCoords) => void, onError?: (error: GeolocationCaptureError) => void) => void;
  reset: () => void;
}

function toCaptureError(error: GeolocationPositionError): GeolocationCaptureError {
  return error.code === error.PERMISSION_DENIED ? "denied" : "unavailable";
}

export function useGeolocation(timeoutMs: number = GEOLOCATION_DEFAULT_TIMEOUT_MS): UseGeolocationResult {
  const [coords, setCoords] = useState<GeolocationCoords | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<GeolocationCaptureError | null>(null);

  const capture = useCallback(
    (onSuccess?: (coords: GeolocationCoords) => void, onError?: (error: GeolocationCaptureError) => void) => {
      if (!navigator.geolocation) {
        setError("unsupported");
        onError?.("unsupported");
        return;
      }
      setIsLocating(true);
      setError(null);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const next: GeolocationCoords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setIsLocating(false);
          setCoords(next);
          onSuccess?.(next);
        },
        (positionError) => {
          const captureError = toCaptureError(positionError);
          setIsLocating(false);
          setError(captureError);
          onError?.(captureError);
        },
        { timeout: timeoutMs },
      );
    },
    [timeoutMs],
  );

  const reset = useCallback(() => {
    setCoords(null);
    setError(null);
  }, []);

  return { coords, isLocating, error, capture, reset };
}
