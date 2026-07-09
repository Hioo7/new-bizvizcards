import { forwardRef, useImperativeHandle } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Link2, Sparkles } from "lucide-react";
import FormTextField from "@components/forms/FormTextField";
import FormTextareaField from "@components/forms/FormTextareaField";
import ImageSlotField from "@features/smart-cards/components/ImageSlotField";
import { profileStepSchema } from "@features/smart-cards/schemas/smartCardStepSchemas";
import type {
  ProfileStepValues,
  SmartCardStepHandle,
} from "@features/smart-cards/types/smartCardForm.types";

interface ProfileStepProps {
  defaultValues: ProfileStepValues;
}

const ProfileStep = forwardRef<
  SmartCardStepHandle<ProfileStepValues>,
  ProfileStepProps
>(function ProfileStep({ defaultValues }, ref) {
  const {
    register,
    control,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<ProfileStepValues>({
    resolver: zodResolver(profileStepSchema),
    defaultValues,
    mode: "onChange",
  });

  useImperativeHandle(ref, () => ({
    validate: async () => {
      const valid = await trigger();
      return valid ? getValues() : null;
    },
    getDraft: () => getValues(),
  }));

  return (
    <div className="flex flex-col gap-4">
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
      <Controller
        control={control}
        name="logo"
        render={({ field }) => (
          <ImageSlotField
            label="Logo"
            value={field.value}
            onChange={field.onChange}
            aspect={1}
            cropShape="round"
          />
        )}
      />
    </div>
  );
});

export default ProfileStep;
