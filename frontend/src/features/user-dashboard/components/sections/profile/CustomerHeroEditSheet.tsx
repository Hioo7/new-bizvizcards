import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link2, Mail, Phone, Sparkles, User } from "lucide-react";
import FormTextField from "@components/forms/FormTextField";
import ImageSlotField from "@components/media/ImageSlotField";
import {
  ComponentEditSheetShell,
  heroSheetSchema,
  type HeroSheetValues,
} from "@features/ecards";
import type { EcardHeroDraft } from "@features/ecards/types/ecardBuilder.types";
import type { ImageFieldValue } from "@app-types/media.types";

interface CustomerHeroEditSheetProps {
  open: boolean;
  draft: EcardHeroDraft;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (draft: EcardHeroDraft) => void;
}

export default function CustomerHeroEditSheet({
  open,
  draft,
  isSubmitting,
  error,
  onClose,
  onSave,
}: CustomerHeroEditSheetProps) {
  const {
    register,
    handleSubmit,
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
  const [photo, setPhoto] = useState<ImageFieldValue>(draft.photo);

  function submit(values: HeroSheetValues) {
    onSave({
      ...values,
      photo,
      organisationId: draft.organisationId,
      autoDownloadContact: draft.autoDownloadContact,
      isExchangeContactEnabled: draft.isExchangeContactEnabled,
    });
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
    </ComponentEditSheetShell>
  );
}
