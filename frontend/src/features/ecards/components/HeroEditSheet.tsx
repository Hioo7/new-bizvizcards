import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link2, Phone, Sparkles } from "lucide-react";
import FormTextField from "@components/forms/FormTextField";
import ImageSlotField from "@components/media/ImageSlotField";
import ComponentEditSheetShell from "@features/ecards/components/ComponentEditSheetShell";
import {
  heroSheetSchema,
  type HeroSheetValues,
} from "@features/ecards/schemas/ecardComponentSchemas";
import type { EcardHeroDraft } from "@features/ecards/types/ecardBuilder.types";
import type { ImageFieldValue } from "@app-types/media.types";

interface HeroEditSheetProps {
  open: boolean;
  draft: EcardHeroDraft;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (draft: EcardHeroDraft) => void;
}

export default function HeroEditSheet({
  open,
  draft,
  isSubmitting,
  error,
  onClose,
  onSave,
}: HeroEditSheetProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HeroSheetValues>({
    resolver: zodResolver(heroSheetSchema),
    defaultValues: {
      endpoint: draft.endpoint,
      companyName: draft.companyName,
      phoneCountryDialCode: draft.phoneCountryDialCode,
      phoneNumber: draft.phoneNumber,
      isExchangeContactEnabled: draft.isExchangeContactEnabled,
    },
  });
  const [photo, setPhoto] = useState<ImageFieldValue>(draft.photo);

  function submit(values: HeroSheetValues) {
    onSave({ ...values, photo });
  }

  return (
    <ComponentEditSheetShell
      open={open}
      icon={Sparkles}
      title="Hero"
      onClose={onClose}
      onSave={() => void handleSubmit(submit)()}
      isSubmitting={isSubmitting}
      error={error}
    >
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
      <label className="flex items-center gap-3 rounded-field border border-base-300 bg-base-200 px-3 py-2.5">
        <input
          type="checkbox"
          className="toggle toggle-primary"
          {...register("isExchangeContactEnabled")}
        />
        <span className="text-sm text-base-content">
          Allow visitors to exchange contact
        </span>
      </label>
    </ComponentEditSheetShell>
  );
}
