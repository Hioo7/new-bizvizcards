import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link2, Video as VideoIcon } from "lucide-react";
import type { ZodType } from "zod";
import FormTextField from "@components/forms/FormTextField";
import EditSheetShell from "@components/EditSheetShell";
import {
  videoSheetSchema,
  type VideoSheetValues,
} from "@features/ecards/schemas/ecardComponentSchemas";
import type { VideoComponentDraft } from "@features/ecards/types/ecardBuilder.types";

interface VideoEditSheetProps {
  open: boolean;
  draft: VideoComponentDraft;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (draft: VideoComponentDraft) => void;
  // Defaults to the e-card's own strict schema (URL required). The
  // organisation e-card template reuses this sheet but passes a relaxed
  // schema, since a template component left blank means "defer to the
  // customer" rather than "invalid input".
  schema?: ZodType<VideoSheetValues, VideoSheetValues>;
}

export default function VideoEditSheet({
  open,
  draft,
  isSubmitting,
  error,
  onClose,
  onSave,
  schema = videoSheetSchema,
}: VideoEditSheetProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VideoSheetValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: draft.title, videoUrl: draft.videoUrl },
  });

  function submit(values: VideoSheetValues) {
    onSave({ type: "VIDEO", ...values });
  }

  return (
    <EditSheetShell
      open={open}
      icon={VideoIcon}
      title="Video"
      onClose={onClose}
      onSave={() => void handleSubmit(submit)()}
      isSubmitting={isSubmitting}
      error={error}
    >
      <FormTextField
        id="title"
        label="Title (optional)"
        icon={VideoIcon}
        registration={register("title")}
        error={errors.title?.message}
      />
      <FormTextField
        id="videoUrl"
        label="YouTube or Vimeo embed URL"
        icon={Link2}
        placeholder="https://www.youtube.com/embed/..."
        registration={register("videoUrl")}
        error={errors.videoUrl?.message}
      />
    </EditSheetShell>
  );
}
