import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2 } from "lucide-react";
import FormTextareaField from "@components/forms/FormTextareaField";
import EditSheetShell from "@components/EditSheetShell";
import {
  aboutUsSheetSchema,
  type AboutUsSheetValues,
} from "@features/ecards/schemas/ecardComponentSchemas";
import type { AboutUsComponentDraft } from "@features/ecards/types/ecardBuilder.types";

interface AboutUsEditSheetProps {
  open: boolean;
  draft: AboutUsComponentDraft;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (draft: AboutUsComponentDraft) => void;
}

export default function AboutUsEditSheet({
  open,
  draft,
  isSubmitting,
  error,
  onClose,
  onSave,
}: AboutUsEditSheetProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AboutUsSheetValues>({
    resolver: zodResolver(aboutUsSheetSchema),
    defaultValues: {
      tagline: draft.tagline,
      content: draft.content,
    },
  });

  function submit(values: AboutUsSheetValues) {
    onSave({ type: "ABOUT_US", ...values });
  }

  return (
    <EditSheetShell
      open={open}
      icon={Building2}
      title="About Us"
      onClose={onClose}
      onSave={() => void handleSubmit(submit)()}
      isSubmitting={isSubmitting}
      error={error}
    >
      <FormTextareaField
        id="tagline"
        label="Tagline"
        rows={2}
        registration={register("tagline")}
        error={errors.tagline?.message}
      />
      <FormTextareaField
        id="content"
        label="About us"
        rows={6}
        registration={register("content")}
        error={errors.content?.message}
      />
    </EditSheetShell>
  );
}
