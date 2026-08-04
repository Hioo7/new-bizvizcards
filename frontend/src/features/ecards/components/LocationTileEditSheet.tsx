import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MapPin, MapPinCheckInside, RotateCcw } from "lucide-react";
import FormTextField from "@components/forms/FormTextField";
import EditSheetShell from "@components/EditSheetShell";
import { LocationMapEmbed } from "@components/LocationMapEmbed";
import { useGeolocation } from "@hooks/useGeolocation";
import {
  locationTileSheetSchema,
  type LocationTileSheetValues,
} from "@features/ecards/schemas/ecardComponentSchemas";
import type { LocationTileComponentDraft } from "@features/ecards/types/ecardBuilder.types";

interface LocationTileEditSheetProps {
  open: boolean;
  draft: LocationTileComponentDraft;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (draft: LocationTileComponentDraft) => void;
  /** The organisation e-card template context allows saving with only a
   * label set, deferring coordinates to the member's own card — the e-card's
   * own builder requires a capture before Save is enabled. */
  requireCapturedLocation?: boolean;
}

export default function LocationTileEditSheet({
  open,
  draft,
  isSubmitting,
  error,
  onClose,
  onSave,
  requireCapturedLocation = true,
}: LocationTileEditSheetProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LocationTileSheetValues>({
    resolver: zodResolver(locationTileSheetSchema),
    defaultValues: { label: draft.label },
  });
  const [latitude, setLatitude] = useState(draft.latitude);
  const [longitude, setLongitude] = useState(draft.longitude);
  const { isLocating, error: geolocationError, capture } = useGeolocation();

  const hasLocation = latitude !== null && longitude !== null;

  function handleCapture() {
    capture((coords) => {
      setLatitude(coords.latitude);
      setLongitude(coords.longitude);
    });
  }

  function submit(values: LocationTileSheetValues) {
    onSave({ type: "LOCATION_TILE", ...values, latitude, longitude });
  }

  const canSave = requireCapturedLocation ? hasLocation : true;

  return (
    <EditSheetShell
      open={open}
      icon={MapPin}
      title="Location"
      onClose={onClose}
      onSave={() => void handleSubmit(submit)()}
      isSubmitting={isSubmitting}
      canSave={canSave}
      error={error}
    >
      <p className="text-sm text-base-content/60">
        A named location shown with a map, captured from your device.
      </p>
      <FormTextField
        id="location-tile-label"
        label="Location name (e.g. Head Office)"
        icon={MapPin}
        registration={register("label")}
        error={errors.label?.message}
      />

      {hasLocation ? (
        <div className="overflow-hidden rounded-2xl border border-base-300">
          <LocationMapEmbed
            query={{ kind: "coords", latitude, longitude }}
            title="Captured location preview"
            heightClassName="h-32"
          />
          <button
            type="button"
            onClick={handleCapture}
            disabled={isLocating}
            className="flex w-full items-center justify-center gap-2 border-t border-base-300 bg-base-100 py-3 text-sm font-semibold text-base-content hover:bg-base-200 disabled:opacity-60"
          >
            {isLocating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            {isLocating ? "Getting your location…" : "Re-capture location"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleCapture}
          disabled={isLocating}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-field border border-dashed border-base-300 bg-base-100 text-sm font-semibold text-base-content hover:bg-base-200 disabled:opacity-60"
        >
          {isLocating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MapPinCheckInside className="h-4 w-4" />
          )}
          {isLocating ? "Getting your location…" : "Capture location"}
        </button>
      )}
      {geolocationError && (
        <p className="text-xs text-error">
          {geolocationError === "denied"
            ? "Location access was denied. Allow location access and try again."
            : geolocationError === "unsupported"
              ? "This device doesn't support location capture."
              : "Couldn't get your location. Try again."}
        </p>
      )}
    </EditSheetShell>
  );
}
