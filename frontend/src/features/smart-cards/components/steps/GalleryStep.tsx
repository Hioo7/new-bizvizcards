import { forwardRef, useImperativeHandle } from "react";
import {
  Controller,
  useFieldArray,
  useForm,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Images, Plus, Trash2, X } from "lucide-react";
import FormTextField from "@components/forms/FormTextField";
import ImageSlotField from "@features/smart-cards/components/ImageSlotField";
import EmptyStepState from "@features/smart-cards/components/EmptyStepState";
import { galleryStepSchema } from "@features/smart-cards/schemas/smartCardStepSchemas";
import {
  SMART_CARD_MAX_GALLERIES,
  SMART_CARD_MAX_GALLERY_IMAGES,
} from "@features/smart-cards/config/smartCardForm.config";
import { emptyImageField } from "@features/smart-cards/types/smartCardForm.types";
import type {
  GalleryStepValues,
  SmartCardStepHandle,
} from "@features/smart-cards/types/smartCardForm.types";

interface GalleryStepProps {
  defaultValues: GalleryStepValues;
}

interface GalleryItemFieldsProps {
  control: Control<GalleryStepValues>;
  register: UseFormRegister<GalleryStepValues>;
  errors: FieldErrors<GalleryStepValues>;
  galleryIndex: number;
  onRemoveGallery: () => void;
}

function GalleryItemFields({
  control,
  register,
  errors,
  galleryIndex,
  onRemoveGallery,
}: GalleryItemFieldsProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `galleries.${galleryIndex}.images`,
  });

  return (
    <div className="flex flex-col gap-3 rounded-field border border-base-300 p-4">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-base-content/50">
          <Images className="h-3.5 w-3.5" />
          Gallery {galleryIndex + 1}
        </span>
        <button
          type="button"
          onClick={onRemoveGallery}
          aria-label={`Remove gallery ${galleryIndex + 1}`}
          className="flex min-h-9 min-w-9 items-center justify-center rounded-field text-base-content/60 hover:bg-error/10 hover:text-error"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <FormTextField
        id={`sc-gallery-title-${galleryIndex}`}
        label="Gallery title"
        icon={Images}
        registration={register(`galleries.${galleryIndex}.title`)}
        error={errors.galleries?.[galleryIndex]?.title?.message}
      />

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-base-content/50">Photos</span>
        {fields.length < SMART_CARD_MAX_GALLERY_IMAGES && (
          <button
            type="button"
            aria-label="Add photo"
            onClick={() => append(emptyImageField())}
            className="flex min-h-9 min-w-9 items-center justify-center rounded-full bg-primary text-primary-content hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>

      {fields.length === 0 ? (
        <EmptyStepState icon={Images} message="No photos in this gallery yet." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {fields.map((imageField, imageIndex) => (
            <div key={imageField.id} className="flex flex-col gap-1.5">
              <Controller
                control={control}
                name={`galleries.${galleryIndex}.images.${imageIndex}`}
                render={({ field }) => (
                  <ImageSlotField
                    label={`Photo ${imageIndex + 1}`}
                    value={field.value}
                    onChange={field.onChange}
                    aspect={4 / 3}
                    cropShape="rect"
                  />
                )}
              />
              <button
                type="button"
                onClick={() => remove(imageIndex)}
                aria-label={`Remove photo ${imageIndex + 1}`}
                className="flex min-h-9 min-w-9 items-center justify-center self-start rounded-field text-base-content/50 hover:bg-error/10 hover:text-error"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const GalleryStep = forwardRef<
  SmartCardStepHandle<GalleryStepValues>,
  GalleryStepProps
>(function GalleryStep({ defaultValues }, ref) {
  const {
    register,
    control,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<GalleryStepValues>({
    resolver: zodResolver(galleryStepSchema),
    defaultValues,
    mode: "onChange",
  });
  const { fields, append, remove } = useFieldArray({ control, name: "galleries" });

  useImperativeHandle(ref, () => ({
    validate: async () => {
      const valid = await trigger();
      return valid ? getValues() : null;
    },
    getDraft: () => getValues(),
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wide text-base-content/60">
          Gallery
        </h3>
        {fields.length < SMART_CARD_MAX_GALLERIES && (
          <button
            type="button"
            aria-label="Add gallery"
            onClick={() => append({ title: "", images: [] })}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-content hover:bg-primary/90"
          >
            <Plus className="h-5 w-5" />
          </button>
        )}
      </div>

      {fields.length === 0 && (
        <EmptyStepState icon={Images} message="No galleries added yet." />
      )}

      {fields.map((field, index) => (
        <GalleryItemFields
          key={field.id}
          control={control}
          register={register}
          errors={errors}
          galleryIndex={index}
          onRemoveGallery={() => remove(index)}
        />
      ))}
    </div>
  );
});

export default GalleryStep;
