import DeliveryPanel from "@features/email-signatures/components/DeliveryPanel";
import EmailSignaturePreview from "@features/email-signatures/components/EmailSignaturePreview";
import { useEmailSignaturePreview } from "@features/email-signatures/hooks/useEmailSignaturePreview";
import type { EmailSignatureDraft } from "@features/email-signatures/types/emailSignatureDraft";

interface ReviewPreviewStepProps {
  value: EmailSignatureDraft;
}

export default function ReviewPreviewStep({ value }: ReviewPreviewStepProps) {
  const { html, isLoading, error } = useEmailSignaturePreview(value);

  return (
    <div className="flex flex-col gap-5">
      <EmailSignaturePreview html={html} isLoading={isLoading} error={error} />
      <div>
        <p className="mb-2 text-xs font-semibold text-base-content/60">
          Get your signature
        </p>
        <DeliveryPanel html={html} />
      </div>
    </div>
  );
}
