import { Avatar } from "@bizvizcards/ui";

// A tiny inline SVG data-URI so the "with photo" case renders offline.
const PHOTO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2D2DE0"/><stop offset="1" stop-color="#60a5fa"/></linearGradient></defs><rect width="96" height="96" fill="url(#g)"/><text x="48" y="58" font-family="sans-serif" font-size="34" fill="#fff" text-anchor="middle">CN</text></svg>`,
  );

export const InitialsFallback = () => (
  <div className="flex items-center gap-3">
    <Avatar name="Chitra Narayan" size="sm" />
    <Avatar name="Chitra Narayan" size="md" />
    <Avatar name="Chitra Narayan" size="lg" />
  </div>
);

export const WithPhoto = () => (
  <div className="flex items-center gap-3">
    <Avatar name="Chitra Narayan" src={PHOTO} size="sm" />
    <Avatar name="Chitra Narayan" src={PHOTO} size="md" />
    <Avatar name="Chitra Narayan" src={PHOTO} size="lg" />
  </div>
);

export const SingleName = () => <Avatar name="Priya" size="md" />;
