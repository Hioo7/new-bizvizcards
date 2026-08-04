import { MapPin } from "lucide-react";
import { LocationMapEmbed } from "@components/LocationMapEmbed";
import type { EcardLocationTileComponent } from "@app-types/ecard";

interface LocationTileSectionProps {
  component: EcardLocationTileComponent;
}

export function LocationTileSection({ component }: LocationTileSectionProps) {
  if (!component.label || component.latitude === null || component.longitude === null) {
    return null;
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-xl">
      <div className="flex items-center gap-2 p-4">
        <MapPin className="h-5 w-5 shrink-0 text-primary" />
        <h2 className="truncate text-lg font-bold break-words">{component.label}</h2>
      </div>
      <LocationMapEmbed
        query={{ kind: "coords", latitude: component.latitude, longitude: component.longitude }}
        title={component.label}
      />
    </div>
  );
}
