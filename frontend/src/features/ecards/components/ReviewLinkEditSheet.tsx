import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Star } from "lucide-react";
import type { ZodType } from "zod";
import FormTextField from "@components/forms/FormTextField";
import EditSheetShell from "@components/EditSheetShell";
import {
  reviewLinkSheetSchema,
  type ReviewLinkSheetValues,
} from "@features/ecards/schemas/ecardComponentSchemas";
import type { ReviewLinkComponentDraft } from "@features/ecards/types/ecardBuilder.types";

interface ReviewLinkEditSheetProps {
  open: boolean;
  draft: ReviewLinkComponentDraft;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (draft: ReviewLinkComponentDraft) => void;
  // Defaults to the e-card's own strict schema (URL required). The
  // organisation e-card template reuses this sheet but passes a relaxed
  // schema, since a template component left blank means "defer to the
  // customer" rather than "invalid input".
  schema?: ZodType<ReviewLinkSheetValues, ReviewLinkSheetValues>;
}

export default function ReviewLinkEditSheet({
  open,
  draft,
  isSubmitting,
  error,
  onClose,
  onSave,
  schema = reviewLinkSheetSchema,
}: ReviewLinkEditSheetProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReviewLinkSheetValues>({
    resolver: zodResolver(schema),
    defaultValues: { url: draft.url },
  });

  function submit(values: ReviewLinkSheetValues) {
    onSave({ type: "REVIEW_LINK", ...values });
  }

  return (
    <EditSheetShell
      open={open}
      icon={Star}
      title="Review Link"
      onClose={onClose}
      onSave={() => void handleSubmit(submit)()}
      isSubmitting={isSubmitting}
      error={error}
    >
      <p className="text-sm text-base-content/60">
        Visitors who tap this card are redirected here to leave a review.
      </p>
      <FormTextField
        id="review-link-url"
        label="Review link"
        icon={Star}
        registration={register("url")}
        error={errors.url?.message}
      />
    </EditSheetShell>
  );
}
