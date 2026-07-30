import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link2, Mail, Phone, Sparkles, User } from "lucide-react";
import FormTextField from "@components/forms/FormTextField";
import ImageSlotField from "@components/media/ImageSlotField";
import EditWizardShell from "@components/EditWizardShell";
import type { FormStepDefinition } from "@components/forms/FormStepShell";
import OrganisationPickerField from "@features/ecards/components/OrganisationPickerField";
import HeroLayoutPickerStep from "@features/ecards/components/HeroLayoutPickerStep";
import HeroThemePickerStep from "@features/ecards/components/HeroThemePickerStep";
import HeroIconShapePickerStep from "@features/ecards/components/HeroIconShapePickerStep";
import AccentColorFieldsGroup from "@features/ecards/components/AccentColorFieldsGroup";
import BannerFieldsGroup from "@features/ecards/components/BannerFieldsGroup";
import OrgBadgeFieldsGroup from "@features/ecards/components/OrgBadgeFieldsGroup";
import {
  heroSheetSchema,
  type HeroSheetValues,
} from "@features/ecards/schemas/ecardComponentSchemas";
import { getHeroLayoutValidationErrors } from "@features/ecards/utils/ecardFormMapping";
import type { EcardHeroDraft } from "@features/ecards/types/ecardBuilder.types";
import type { ImageFieldValue } from "@app-types/media.types";
import type { ECardHeroLayout, ECardIconShape, ECardTheme } from "@app-types/ecard";
import type { EcardAccentColorPreset } from "@app-types/plan";
import { useFieldHighlight } from "@hooks/useFieldHighlight";

const HERO_WIZARD_STEPS: FormStepDefinition[] = [
  { id: "identity", label: "Identity" },
  { id: "layout", label: "Layout" },
  { id: "style", label: "Style" },
  { id: "details", label: "Details" },
];

const HERO_RHF_FIELD_NAMES = [
  "endpoint",
  "name",
  "email",
  "companyName",
  "phoneCountryDialCode",
  "phoneNumber",
] as const;

interface HeroEditSheetProps {
  open: boolean;
  customerId: string;
  draft: EcardHeroDraft;
  isSubmitting: boolean;
  error: string | null;
  /** Field-level errors surfaced from outside the sheet (failed client-side pre-check
   * or a server validation/conflict response) — keyed by this sheet's own field names. */
  fieldErrors?: Record<string, string> | null;
  /** Which layouts the customer's plan allows — null while still loading. */
  availableHeroLayouts?: Record<ECardHeroLayout, boolean> | null;
  /** Which themes/icon shapes the customer's plan allows — null while still loading. */
  availableThemes?: Record<ECardTheme, boolean> | null;
  availableIconShapes?: Record<ECardIconShape, boolean> | null;
  accentColorCustomizationAvailable?: boolean;
  accentColorPresets?: EcardAccentColorPreset[];
  /** Set when the linked organisation's template locks one or both accent
   * colors — those fields render read-only in the Style step. */
  organisationAccentColorLock?: {
    primaryAccentColor: string | null;
    secondaryAccentColor: string | null;
  } | null;
  onClose: () => void;
  onSave: (draft: EcardHeroDraft) => void;
}

export default function HeroEditSheet({
  open,
  customerId,
  draft,
  isSubmitting,
  error,
  fieldErrors,
  availableHeroLayouts = null,
  availableThemes = null,
  availableIconShapes = null,
  accentColorCustomizationAvailable = false,
  accentColorPresets = [],
  organisationAccentColorLock = null,
  onClose,
  onSave,
}: HeroEditSheetProps) {
  const {
    register,
    trigger,
    getValues,
    setError,
    formState: { errors },
  } = useForm<HeroSheetValues>({
    resolver: zodResolver(heroSheetSchema),
    defaultValues: {
      endpoint: draft.endpoint,
      name: draft.name,
      email: draft.email,
      companyName: draft.companyName,
      phoneCountryDialCode: draft.phoneCountryDialCode,
      phoneNumber: draft.phoneNumber,
    },
  });
  // Jump straight to whichever step a server rejection points at, computed once
  // at mount (this sheet always remounts fresh when reopened) rather than via
  // an effect that would call setState reactively after the initial render.
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (!fieldErrors) return 0;
    if (
      fieldErrors.banner ||
      fieldErrors.bannerFallbackColor ||
      fieldErrors.badgeFallbackColor
    ) {
      return 3;
    }
    if (
      fieldErrors.heroTheme ||
      fieldErrors.heroIconShape ||
      fieldErrors.heroPrimaryAccentColor ||
      fieldErrors.heroSecondaryAccentColor
    ) {
      return 2;
    }
    if (fieldErrors.layout) return 1;
    return 0;
  });
  const [stepError, setStepError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<ImageFieldValue>(draft.photo);
  const [organisationId, setOrganisationId] = useState<string | null>(
    draft.organisationId,
  );
  const [layout, setLayout] = useState<ECardHeroLayout>(draft.layout);
  const [banner, setBanner] = useState<ImageFieldValue>(draft.banner);
  const [bannerFallbackColor, setBannerFallbackColor] = useState(
    draft.bannerFallbackColor,
  );
  const [badgeFallbackColor, setBadgeFallbackColor] = useState(
    draft.badgeFallbackColor,
  );
  const [theme, setTheme] = useState<ECardTheme>(draft.theme);
  const [iconShape, setIconShape] = useState<ECardIconShape>(draft.iconShape);
  const [primaryAccentColor, setPrimaryAccentColor] = useState(
    draft.primaryAccentColor,
  );
  const [secondaryAccentColor, setSecondaryAccentColor] = useState(
    draft.secondaryAccentColor,
  );
  const { highlightedField, triggerHighlight } = useFieldHighlight();

  useEffect(() => {
    if (!open || !fieldErrors) return;
    const rhfFields = HERO_RHF_FIELD_NAMES.filter((field) => fieldErrors[field]);
    rhfFields.forEach((field) => {
      setError(field, { type: "server", message: fieldErrors[field] });
    });
    if (rhfFields.length > 0) triggerHighlight(rhfFields[0]);
  }, [open, fieldErrors, setError, triggerHighlight]);

  const stepId = HERO_WIZARD_STEPS[currentIndex].id;

  function handleBack() {
    setStepError(null);
    setCurrentIndex((index) => Math.max(0, index - 1));
  }

  async function handleNext() {
    setStepError(null);

    if (stepId === "identity") {
      const isValid = await trigger(HERO_RHF_FIELD_NAMES);
      if (!isValid) return;
      setCurrentIndex(1);
      return;
    }

    if (stepId === "layout") {
      setCurrentIndex(2);
      return;
    }

    if (stepId === "style") {
      setCurrentIndex(3);
      return;
    }

    const values = getValues();
    const heroDraft: EcardHeroDraft = {
      ...values,
      photo,
      organisationId,
      organisationLogoUrl: draft.organisationLogoUrl,
      layout,
      banner,
      bannerFallbackColor,
      badgeFallbackColor,
      theme,
      iconShape,
      primaryAccentColor,
      secondaryAccentColor,
      autoDownloadContact: draft.autoDownloadContact,
      isExchangeContactEnabled: draft.isExchangeContactEnabled,
    };
    const layoutErrors = getHeroLayoutValidationErrors(heroDraft);
    if (layoutErrors) {
      setStepError(Object.values(layoutErrors)[0]);
      return;
    }
    onSave(heroDraft);
  }

  return (
    <EditWizardShell
      open={open}
      icon={Sparkles}
      title="Hero"
      steps={HERO_WIZARD_STEPS}
      currentIndex={currentIndex}
      isSubmitting={isSubmitting}
      error={stepError ?? error}
      onClose={onClose}
      onBack={handleBack}
      onNext={() => void handleNext()}
    >
      {stepId === "identity" && (
        <div className="flex flex-col gap-4">
          <ImageSlotField
            label="Profile photo"
            value={photo}
            onChange={setPhoto}
            cropShape="round"
            aspect={1}
          />
          <FormTextField
            id="endpoint"
            label="Card URL (e.g. jane-doe)"
            icon={Link2}
            registration={register("endpoint")}
            error={errors.endpoint?.message}
            highlight={highlightedField === "endpoint"}
          />
          <FormTextField
            id="name"
            label="Name"
            icon={User}
            registration={register("name")}
            error={errors.name?.message}
            highlight={highlightedField === "name"}
          />
          <FormTextField
            id="email"
            label="Email"
            type="email"
            icon={Mail}
            registration={register("email")}
            error={errors.email?.message}
            highlight={highlightedField === "email"}
          />
          <FormTextField
            id="companyName"
            label="Company"
            icon={Sparkles}
            registration={register("companyName")}
            error={errors.companyName?.message}
            highlight={highlightedField === "companyName"}
          />
          <OrganisationPickerField
            customerId={customerId}
            value={organisationId}
            onChange={setOrganisationId}
          />
          <div className="flex gap-3">
            <div className="w-24">
              <FormTextField
                id="phoneCountryDialCode"
                label="Dial code"
                icon={Phone}
                registration={register("phoneCountryDialCode")}
                error={errors.phoneCountryDialCode?.message}
                highlight={highlightedField === "phoneCountryDialCode"}
              />
            </div>
            <div className="flex-1">
              <FormTextField
                id="phoneNumber"
                label="Phone number"
                icon={Phone}
                registration={register("phoneNumber")}
                error={errors.phoneNumber?.message}
                highlight={highlightedField === "phoneNumber"}
              />
            </div>
          </div>
        </div>
      )}

      {stepId === "layout" && (
        <HeroLayoutPickerStep
          value={layout}
          onChange={setLayout}
          availableLayouts={availableHeroLayouts}
          hasOrganisationLinked={organisationId !== null}
        />
      )}

      {stepId === "style" && (
        <div className="flex flex-col gap-5">
          <HeroThemePickerStep
            value={theme}
            onChange={setTheme}
            availableThemes={availableThemes}
          />
          <HeroIconShapePickerStep
            value={iconShape}
            onChange={setIconShape}
            availableIconShapes={availableIconShapes}
          />
          <AccentColorFieldsGroup
            primaryAccentColor={primaryAccentColor}
            secondaryAccentColor={secondaryAccentColor}
            onChange={(primary, secondary) => {
              setPrimaryAccentColor(primary);
              setSecondaryAccentColor(secondary);
            }}
            theme={theme}
            presets={accentColorPresets}
            customizationAvailable={accentColorCustomizationAvailable}
            organisationLock={organisationAccentColorLock}
          />
        </div>
      )}

      {stepId === "details" && (
        <>
          {layout === "DEFAULT" && (
            <p className="text-sm text-base-content/60">
              The Default layout needs no extra details.
            </p>
          )}
          {(layout === "BANNER" || layout === "BANNER_PROFILE") && (
            <BannerFieldsGroup
              banner={banner}
              onBannerChange={setBanner}
              fallbackColor={bannerFallbackColor}
              onFallbackColorChange={setBannerFallbackColor}
            />
          )}
          {layout === "ORG_BADGE" && (
            <OrgBadgeFieldsGroup
              organisationLogoUrl={draft.organisationLogoUrl}
              fallbackColor={badgeFallbackColor}
              onFallbackColorChange={setBadgeFallbackColor}
            />
          )}
        </>
      )}
    </EditWizardShell>
  );
}
