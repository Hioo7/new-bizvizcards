import { forwardRef, useImperativeHandle } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Link2, Sparkles } from "lucide-react";
import { z } from "zod";
import FormTextField from "@components/forms/FormTextField";
import FormTextareaField from "@components/forms/FormTextareaField";
import ImageSlotField from "@components/media/ImageSlotField";
import { profileStepSchema } from "@features/smart-cards/schemas/smartCardStepSchemas";
import {
  SMART_CARD_DEFAULT_LOGO_SHAPE,
  SMART_CARD_LOGO_SHAPE_OPTIONS,
} from "./config/logoShape.config";
import type {
  ProfileStepValues,
  SmartCardStepHandle,
} from "@features/smart-cards/types/smartCardForm.types";

interface ProfileStepProps {
  defaultValues: ProfileStepValues;
}

// Template 3 is the only template that exposes logo shape, so it validates
// against a superset of the shared profile schema rather than modifying it.
const profileStepSchemaTemplate3 = profileStepSchema.extend({
  logoShape: z.enum(["CIRCLE", "RECTANGLE", "FREEFORM"]),
});

type ProfileStepTemplate3Values = z.infer<typeof profileStepSchemaTemplate3>;

/**
 * Template-3-specific variant of the shared ProfileStep: adds the logo shape
 * picker and switches the logo's crop behavior to match — round crop for
 * Circle, square crop for Rectangle, no crop at all for Freeform (matching
 * how the public hero renders each shape).
 */
const ProfileStep = forwardRef<
  SmartCardStepHandle<ProfileStepValues>,
  ProfileStepProps
>(function ProfileStep({ defaultValues }, ref) {
  const {
    register,
    control,
    trigger,
    getValues,
    watch,
    formState: { errors },
  } = useForm<ProfileStepTemplate3Values>({
    resolver: zodResolver(profileStepSchemaTemplate3),
    defaultValues: {
      ...defaultValues,
      logoShape: defaultValues.logoShape ?? SMART_CARD_DEFAULT_LOGO_SHAPE,
    },
    mode: "onChange",
  });

  useImperativeHandle(ref, () => ({
    validate: async () => {
      const valid = await trigger();
      return valid ? getValues() : null;
    },
    getDraft: () => getValues(),
  }));

  const logoShape = watch("logoShape") ?? SMART_CARD_DEFAULT_LOGO_SHAPE;

  return (
    <div className="flex flex-col gap-4">
      <Controller
        control={control}
        name="logoShape"
        render={({ field }) => (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold text-base-content/70">
              Logo shape
            </p>
            <div className="join w-full">
              {SMART_CARD_LOGO_SHAPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => field.onChange(option.value)}
                  className={`join-item btn min-h-11 flex-1 ${
                    field.value === option.value
                      ? "btn-primary"
                      : "btn-outline"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      />
      <Controller
        control={control}
        name="logo"
        render={({ field }) => (
          <ImageSlotField
            label="Logo"
            value={field.value}
            onChange={field.onChange}
            aspect={1}
            cropShape={logoShape === "CIRCLE" ? "round" : "rect"}
            skipCrop={logoShape === "FREEFORM"}
          />
        )}
      />
      <FormTextField
        id="sc-endpoint"
        label="Public link (yoursite.com/smartcard/…)"
        icon={Link2}
        registration={register("endpoint")}
        error={errors.endpoint?.message}
      />
      <FormTextField
        id="sc-company-name"
        label="Company name"
        icon={Building2}
        registration={register("companyName")}
        error={errors.companyName?.message}
      />
      <FormTextField
        id="sc-tagline"
        label="Tagline"
        icon={Sparkles}
        registration={register("tagline")}
        error={errors.tagline?.message}
      />
      <FormTextareaField
        id="sc-sub-tagline"
        label="Sub-tagline"
        rows={2}
        registration={register("subTagline")}
        error={errors.subTagline?.message}
      />
      <FormTextareaField
        id="sc-about"
        label="About"
        rows={4}
        registration={register("aboutText")}
        error={errors.aboutText?.message}
      />
    </div>
  );
});

export default ProfileStep;
