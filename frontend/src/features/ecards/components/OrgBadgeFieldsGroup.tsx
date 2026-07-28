import ColorField from "@components/forms/ColorField";

interface OrgBadgeFieldsGroupProps {
  organisationLogoUrl: string | null;
  fallbackColor: string;
  onFallbackColorChange: (value: string) => void;
  colorError?: string;
}

export default function OrgBadgeFieldsGroup({
  organisationLogoUrl,
  fallbackColor,
  onFallbackColorChange,
  colorError,
}: OrgBadgeFieldsGroupProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-200 p-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-base-300 bg-base-100">
          {organisationLogoUrl ? (
            <img
              src={organisationLogoUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-[10px] text-base-content/40">No logo</span>
          )}
        </div>
        <p className="text-xs text-base-content/60">
          Your organisation&rsquo;s logo shows as a badge over the profile
          photo. The fallback color fills any transparent area behind it.
        </p>
      </div>
      <ColorField
        id="badgeFallbackColor"
        label="Badge fallback color"
        value={fallbackColor}
        onChange={onFallbackColorChange}
        error={colorError}
      />
    </div>
  );
}
