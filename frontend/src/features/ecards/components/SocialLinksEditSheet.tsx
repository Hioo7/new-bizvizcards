import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link2 } from "lucide-react";
import FormTextField from "@components/forms/FormTextField";
import ComponentEditSheetShell from "@features/ecards/components/ComponentEditSheetShell";
import {
  socialLinksSheetSchema,
  type SocialLinksSheetValues,
} from "@features/ecards/schemas/ecardComponentSchemas";
import type { SocialLinksComponentDraft } from "@features/ecards/types/ecardBuilder.types";

interface SocialLinksEditSheetProps {
  open: boolean;
  draft: SocialLinksComponentDraft;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (draft: SocialLinksComponentDraft) => void;
}

const FIELDS: { name: keyof SocialLinksSheetValues; label: string }[] = [
  { name: "whatsapp", label: "WhatsApp link" },
  { name: "website", label: "Website" },
  { name: "instagram", label: "Instagram" },
  { name: "facebook", label: "Facebook" },
  { name: "twitter", label: "Twitter / X" },
  { name: "linkedIn", label: "LinkedIn" },
];

export default function SocialLinksEditSheet({
  open,
  draft,
  isSubmitting,
  error,
  onClose,
  onSave,
}: SocialLinksEditSheetProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SocialLinksSheetValues>({
    resolver: zodResolver(socialLinksSheetSchema),
    defaultValues: {
      whatsapp: draft.whatsapp,
      website: draft.website,
      instagram: draft.instagram,
      facebook: draft.facebook,
      twitter: draft.twitter,
      linkedIn: draft.linkedIn,
    },
  });

  function submit(values: SocialLinksSheetValues) {
    onSave({ type: "SOCIAL_LINKS", ...values });
  }

  return (
    <ComponentEditSheetShell
      open={open}
      icon={Link2}
      title="Social Links"
      onClose={onClose}
      onSave={() => void handleSubmit(submit)()}
      isSubmitting={isSubmitting}
      error={error}
    >
      {FIELDS.map((field) => (
        <FormTextField
          key={field.name}
          id={field.name}
          label={field.label}
          icon={Link2}
          registration={register(field.name)}
          error={errors[field.name]?.message}
        />
      ))}
    </ComponentEditSheetShell>
  );
}
