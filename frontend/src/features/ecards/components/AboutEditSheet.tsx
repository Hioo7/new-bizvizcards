import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText } from "lucide-react";
import FormTextField from "@components/forms/FormTextField";
import FormTextareaField from "@components/forms/FormTextareaField";
import EditSheetShell from "@components/EditSheetShell";
import {
  aboutSheetSchema,
  type AboutSheetValues,
} from "@features/ecards/schemas/ecardComponentSchemas";
import type { AboutComponentDraft } from "@features/ecards/types/ecardBuilder.types";

interface AboutEditSheetProps {
  open: boolean;
  draft: AboutComponentDraft;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (draft: AboutComponentDraft) => void;
}

export default function AboutEditSheet({
  open,
  draft,
  isSubmitting,
  error,
  onClose,
  onSave,
}: AboutEditSheetProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AboutSheetValues>({
    resolver: zodResolver(aboutSheetSchema),
    defaultValues: {
      profession: draft.profession,
      shortNote: draft.shortNote,
      description: draft.description,
      aboutMe: draft.aboutMe,
    },
  });

  function submit(values: AboutSheetValues) {
    onSave({ type: "ABOUT", ...values });
  }

  return (
    <EditSheetShell
      open={open}
      icon={FileText}
      title="About / Bio"
      onClose={onClose}
      onSave={() => void handleSubmit(submit)()}
      isSubmitting={isSubmitting}
      error={error}
    >
      <FormTextField
        id="profession"
        label="Profession"
        icon={FileText}
        registration={register("profession")}
        error={errors.profession?.message}
      />
      <FormTextareaField
        id="shortNote"
        label="Short note / tagline"
        rows={2}
        registration={register("shortNote")}
        error={errors.shortNote?.message}
      />
      <FormTextareaField
        id="description"
        label="Description"
        rows={4}
        registration={register("description")}
        error={errors.description?.message}
      />
      <FormTextareaField
        id="aboutMe"
        label="About me"
        rows={4}
        registration={register("aboutMe")}
        error={errors.aboutMe?.message}
      />
    </EditSheetShell>
  );
}
