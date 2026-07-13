import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link2, Video as VideoIcon } from "lucide-react";
import FormTextField from "@components/forms/FormTextField";
import ComponentEditSheetShell from "@features/ecards/components/ComponentEditSheetShell";
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
}

export default function VideoEditSheet({
  open,
  draft,
  isSubmitting,
  error,
  onClose,
  onSave,
}: VideoEditSheetProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VideoSheetValues>({
    resolver: zodResolver(videoSheetSchema),
    defaultValues: { title: draft.title, videoUrl: draft.videoUrl },
  });

  function submit(values: VideoSheetValues) {
    onSave({ type: "VIDEO", ...values });
  }

  return (
    <ComponentEditSheetShell
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
    </ComponentEditSheetShell>
  );
}
