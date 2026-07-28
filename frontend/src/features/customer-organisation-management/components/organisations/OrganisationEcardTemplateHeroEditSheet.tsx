import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Phone, Sparkles, User } from "lucide-react";
import FormTextField from "@components/forms/FormTextField";
import ImageSlotField from "@components/media/ImageSlotField";
import EditWizardShell from "@components/EditWizardShell";
import type { FormStepDefinition } from "@components/forms/FormStepShell";
import {
  BannerFieldsGroup,
  HeroLayoutPickerStep,
  OrgBadgeFieldsGroup,
} from "@features/ecards";
import {
  organisationEcardTemplateHeroSheetSchema,
  type OrganisationEcardTemplateHeroSheetValues,
} from "@features/customer-organisation-management/schemas/organisationEcardTemplateHeroSchema";
import type { OrganisationEcardTemplateHeroDraft } from "@features/customer-organisation-management/types/organisationEcardTemplateBuilder.types";
import type { ImageFieldValue } from "@app-types/media.types";
import type { ECardHeroLayout } from "@app-types/ecard";

const HERO_WIZARD_STEPS: FormStepDefinition[] = [
  { id: "identity", label: "Identity" },
  { id: "layout", label: "Layout" },
  { id: "details", label: "Details" },
];

interface OrganisationEcardTemplateHeroEditSheetProps {
  open: boolean;
  draft: OrganisationEcardTemplateHeroDraft;
  isSubmitting: boolean;
  error: string | null;
  /** Which layouts the organisation's own plan boost allows — null while still loading. */
  availableHeroLayouts?: Record<ECardHeroLayout, boolean> | null;
  onClose: () => void;
  onSave: (draft: OrganisationEcardTemplateHeroDraft) => void;
}

export default function OrganisationEcardTemplateHeroEditSheet({
  open,
  draft,
  isSubmitting,
  error,
  availableHeroLayouts = null,
  onClose,
  onSave,
}: OrganisationEcardTemplateHeroEditSheetProps) {
  const {
    register,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<OrganisationEcardTemplateHeroSheetValues>({
    resolver: zodResolver(organisationEcardTemplateHeroSheetSchema),
    defaultValues: {
      name: draft.name,
      email: draft.email,
      companyName: draft.companyName,
      phoneCountryDialCode: draft.phoneCountryDialCode,
      phoneNumber: draft.phoneNumber,
    },
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [photo, setPhoto] = useState<ImageFieldValue>(draft.photo);
  // "Unset" (null) means "defer to each member's own card" — starting the
  // picker on DEFAULT is just this step's own starting point, not a saved
  // choice, until the SPOC actually advances past it.
  const [layout, setLayout] = useState<ECardHeroLayout>(draft.layout ?? "DEFAULT");
  const [banner, setBanner] = useState<ImageFieldValue>(draft.banner);
  const [bannerFallbackColor, setBannerFallbackColor] = useState(
    draft.bannerFallbackColor,
  );
  const [badgeFallbackColor, setBadgeFallbackColor] = useState(
    draft.badgeFallbackColor,
  );

  const stepId = HERO_WIZARD_STEPS[currentIndex].id;

  function handleBack() {
    setCurrentIndex((index) => Math.max(0, index - 1));
  }

  async function handleNext() {
    if (stepId === "identity") {
      const isValid = await trigger([
        "name",
        "email",
        "companyName",
        "phoneCountryDialCode",
        "phoneNumber",
      ]);
      if (!isValid) return;
      setCurrentIndex(1);
      return;
    }

    if (stepId === "layout") {
      setCurrentIndex(2);
      return;
    }

    const values = getValues();
    onSave({
      ...values,
      photo,
      layout,
      banner,
      bannerFallbackColor,
      badgeFallbackColor,
    });
  }

  return (
    <EditWizardShell
      open={open}
      icon={Sparkles}
      title="Branding"
      steps={HERO_WIZARD_STEPS}
      currentIndex={currentIndex}
      isSubmitting={isSubmitting}
      error={error}
      onClose={onClose}
      onBack={handleBack}
      onNext={() => void handleNext()}
    >
      {stepId === "identity" && (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-base-content/50">
            Leave any field blank to keep each member&rsquo;s own e-card as-is —
            only what you set here overrides their card.
          </p>
          <ImageSlotField
            label="Profile photo"
            value={photo}
            onChange={setPhoto}
            cropShape="round"
            aspect={1}
          />
          <FormTextField
            id="name"
            label="Name"
            icon={User}
            registration={register("name")}
            error={errors.name?.message}
          />
          <FormTextField
            id="email"
            label="Email"
            type="email"
            icon={Mail}
            registration={register("email")}
            error={errors.email?.message}
          />
          <FormTextField
            id="companyName"
            label="Company"
            icon={Sparkles}
            registration={register("companyName")}
            error={errors.companyName?.message}
          />
          <div className="flex gap-3">
            <div className="w-24">
              <FormTextField
                id="phoneCountryDialCode"
                label="Dial code"
                icon={Phone}
                registration={register("phoneCountryDialCode")}
                error={errors.phoneCountryDialCode?.message}
              />
            </div>
            <div className="flex-1">
              <FormTextField
                id="phoneNumber"
                label="Phone number"
                icon={Phone}
                registration={register("phoneNumber")}
                error={errors.phoneNumber?.message}
              />
            </div>
          </div>
        </div>
      )}

      {stepId === "layout" && (
        <>
          <p className="mb-3 text-xs text-base-content/50">
            Sets a shared layout for every member&rsquo;s e-card. Leave this as
            Default to let each member choose their own.
          </p>
          <HeroLayoutPickerStep
            value={layout}
            onChange={setLayout}
            availableLayouts={availableHeroLayouts}
            hasOrganisationLinked
          />
        </>
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
              organisationLogoUrl={null}
              fallbackColor={badgeFallbackColor}
              onFallbackColorChange={setBadgeFallbackColor}
            />
          )}
        </>
      )}
    </EditWizardShell>
  );
}
