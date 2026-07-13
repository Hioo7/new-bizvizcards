import { useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { EXCHANGE_CONTACT_GEOLOCATION_TIMEOUT_MS } from "@config/exchangeContact.config";

export interface GeolocationCoords {
  latitude: number;
  longitude: number;
}

interface ExchangeContactLocationStageProps {
  isSubmitting: boolean;
  onShareLocation: (coords: GeolocationCoords) => void;
  onSkip: () => void;
}

export default function ExchangeContactLocationStage({
  isSubmitting,
  onShareLocation,
  onSkip,
}: ExchangeContactLocationStageProps) {
  const [isLocating, setIsLocating] = useState(false);

  function handleShareLocation() {
    if (!navigator.geolocation) {
      onSkip();
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        onShareLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        setIsLocating(false);
        onSkip();
      },
      { timeout: EXCHANGE_CONTACT_GEOLOCATION_TIMEOUT_MS },
    );
  }

  const busy = isLocating || isSubmitting;

  return (
    <div className="mt-5 space-y-4 text-center">
      <div className="flex justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
          <MapPin className="h-7 w-7 text-blue-600" />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-900">Share your location?</h3>
        <p className="mt-1 text-sm text-gray-600">
          This helps the business find you faster. Totally optional.
        </p>
      </div>
      <button
        type="button"
        onClick={handleShareLocation}
        disabled={busy}
        className="w-full text-white py-3 rounded-xl font-semibold transition bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {isLocating && <Loader2 className="h-4 w-4 animate-spin" />}
        {isLocating ? "Getting your location…" : "Share location"}
      </button>
      <button
        type="button"
        onClick={onSkip}
        disabled={busy}
        className="w-full py-3 rounded-xl font-semibold border border-gray-200 text-gray-800 bg-white hover:bg-gray-50 transition disabled:opacity-60"
      >
        Skip
      </button>
    </div>
  );
}
