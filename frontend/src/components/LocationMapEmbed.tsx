import { MAP_EMBED_DEFAULT_HEIGHT_CLASS } from "@config/mapEmbed.config";

type LocationMapEmbedQuery =
  | { kind: "address"; address: string }
  | { kind: "coords"; latitude: number; longitude: number };

interface LocationMapEmbedProps {
  query: LocationMapEmbedQuery;
  title: string;
  heightClassName?: string;
  className?: string;
}

function buildEmbedSrc(query: LocationMapEmbedQuery): string {
  const q = query.kind === "address" ? query.address : `${query.latitude},${query.longitude}`;
  return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
}

export function LocationMapEmbed({ query, title, heightClassName, className }: LocationMapEmbedProps) {
  const classes = ["w-full border-0", heightClassName ?? MAP_EMBED_DEFAULT_HEIGHT_CLASS, className]
    .filter(Boolean)
    .join(" ");

  return (
    <iframe
      src={buildEmbedSrc(query)}
      className={classes}
      loading="lazy"
      title={title}
    />
  );
}
