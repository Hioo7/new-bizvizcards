import ImageSlotField from "@components/media/ImageSlotField";
import ColorField from "@components/forms/ColorField";
import {
  ECARD_HERO_BANNER_ASPECT,
  ECARD_HERO_BANNER_ASPECT_CLASS,
} from "@features/ecards/config/ecardBuilder.config";
import type { ImageFieldValue } from "@app-types/media.types";

interface BannerFieldsGroupProps {
  banner: ImageFieldValue;
  onBannerChange: (value: ImageFieldValue) => void;
  bannerError?: string;
  fallbackColor: string;
  onFallbackColorChange: (value: string) => void;
  colorError?: string;
}

export default function BannerFieldsGroup({
  banner,
  onBannerChange,
  bannerError,
  fallbackColor,
  onFallbackColorChange,
  colorError,
}: BannerFieldsGroupProps) {
  return (
    <div className="flex flex-col gap-4">
      <ImageSlotField
        label="Banner image"
        value={banner}
        onChange={onBannerChange}
        cropShape="rect"
        aspect={ECARD_HERO_BANNER_ASPECT}
        variant="card"
        containerAspectClass={ECARD_HERO_BANNER_ASPECT_CLASS}
        error={bannerError}
      />
      <ColorField
        id="bannerFallbackColor"
        label="Fallback color"
        value={fallbackColor}
        onChange={onFallbackColorChange}
        error={colorError}
      />
    </div>
  );
}
