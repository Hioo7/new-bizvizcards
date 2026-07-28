import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link2, Mail, Phone, Sparkles, User } from "lucide-react";
import FormTextField from "@components/forms/FormTextField";
import ImageSlotField from "@components/media/ImageSlotField";
import EditSheetShell from "@components/EditSheetShell";
import OrganisationPickerField from "@features/ecards/components/OrganisationPickerField";
import {
  heroSheetSchema,
  type HeroSheetValues,
} from "@features/ecards/schemas/ecardComponentSchemas";
import type { EcardHeroDraft } from "@features/ecards/types/ecardBuilder.types";
import type { ImageFieldValue } from "@app-types/media.types";
import { useFieldHighlight } from "@hooks/useFieldHighlight";

interface HeroEditSheetProps {
  open: boolean;
  customerId: string;
  draft: EcardHeroDraft;
  isSubmitting: boolean;
  error: string | null;
  /** Field-level errors surfaced from outside the sheet (failed client-side pre-check
   * or a server validation/conflict response) — keyed by this sheet's own field names. */
  fieldErrors?: Record<string, string> | null;
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
  onClose,
  onSave,
}: HeroEditSheetProps) {
  const {
    register,
    handleSubmit,
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
  const [photo, setPhoto] = useState<ImageFieldValue>(draft.photo);
  const [organisationId, setOrganisationId] = useState<string | null>(
    draft.organisationId,
  );
  const { highlightedField, triggerHighlight } = useFieldHighlight();

  useEffect(() => {
    if (!open || !fieldErrors) return;
    const fields = Object.keys(fieldErrors) as (keyof HeroSheetValues)[];
    fields.forEach((field) => {
      setError(field, { type: "server", message: fieldErrors[field] });
    });
    if (fields.length > 0) triggerHighlight(fields[0]);
  }, [open, fieldErrors, setError, triggerHighlight]);

  function submit(values: HeroSheetValues) {
    onSave({
      ...values,
      photo,
      organisationId,
      autoDownloadContact: draft.autoDownloadContact,
      isExchangeContactEnabled: draft.isExchangeContactEnabled,
    });
  }

  return (
    <EditSheetShell
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
    </EditSheetShell>
  );
}
