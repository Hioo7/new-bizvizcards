import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Phone, Sparkles, User } from "lucide-react";
import FormTextField from "@components/forms/FormTextField";
import ImageSlotField from "@components/media/ImageSlotField";
import EditSheetShell from "@components/EditSheetShell";
import {
  organisationEcardTemplateHeroSheetSchema,
  type OrganisationEcardTemplateHeroSheetValues,
} from "@features/customer-organisation-management/schemas/organisationEcardTemplateHeroSchema";
import type { OrganisationEcardTemplateHeroDraft } from "@features/customer-organisation-management/types/organisationEcardTemplateBuilder.types";
import type { ImageFieldValue } from "@app-types/media.types";

interface OrganisationEcardTemplateHeroEditSheetProps {
  open: boolean;
  draft: OrganisationEcardTemplateHeroDraft;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (draft: OrganisationEcardTemplateHeroDraft) => void;
}

export default function OrganisationEcardTemplateHeroEditSheet({
  open,
  draft,
  isSubmitting,
  error,
  onClose,
  onSave,
}: OrganisationEcardTemplateHeroEditSheetProps) {
  const {
    register,
    handleSubmit,
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
  const [photo, setPhoto] = useState<ImageFieldValue>(draft.photo);

  function submit(values: OrganisationEcardTemplateHeroSheetValues) {
    onSave({ ...values, photo });
  }

  return (
    <EditSheetShell
      open={open}
      icon={Sparkles}
      title="Branding"
      onClose={onClose}
      onSave={() => void handleSubmit(submit)()}
      isSubmitting={isSubmitting}
      error={error}
    >
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
    </EditSheetShell>
  );
}
