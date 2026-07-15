import { useState } from "react";
import ImageSlotField from "@components/media/ImageSlotField";
import type { ImageFieldValue } from "@app-types/media.types";
import { useAsyncAction } from "@hooks/useAsyncAction";

interface OrganisationLogoFieldProps {
  organisationId: string;
  logoUrl: string | null;
  onUpload: (file: File) => Promise<string>;
  onRemove: () => Promise<void>;
}

export default function OrganisationLogoField({
  organisationId,
  logoUrl,
  onUpload,
  onRemove,
}: OrganisationLogoFieldProps) {
  const [value, setValue] = useState<ImageFieldValue>({
    file: null,
    existingUrl: logoUrl ?? undefined,
  });
  const uploadAction = useAsyncAction();
  const removeAction = useAsyncAction();

  const handleChange = (next: ImageFieldValue) => {
    setValue(next);
    if (next.file) {
      void uploadAction.run(
        async () => {
          const url = await onUpload(next.file as File);
          setValue({ file: null, existingUrl: url });
        },
        () => {},
      );
    }
  };

  const handleRemove = () => {
    void removeAction.run(
      async () => {
        await onRemove();
        setValue({ file: null, existingUrl: undefined });
      },
      () => {},
    );
  };

  return (
    <div key={organisationId}>
      <ImageSlotField
        label="Organisation logo"
        value={value}
        onChange={handleChange}
        cropShape="round"
        onRemove={value.existingUrl || value.file ? handleRemove : undefined}
      />
      {(uploadAction.error || removeAction.error) && (
        <p className="mt-1.5 text-center text-xs text-error">
          {uploadAction.error ?? removeAction.error}
        </p>
      )}
    </div>
  );
}
