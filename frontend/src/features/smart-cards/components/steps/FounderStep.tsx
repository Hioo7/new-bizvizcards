import { forwardRef, useImperativeHandle } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Award, Briefcase, TrendingUp, User } from "lucide-react";
import FormTextField from "@components/forms/FormTextField";
import FormTextareaField from "@components/forms/FormTextareaField";
import ImageSlotField from "@features/smart-cards/components/ImageSlotField";
import { founderStepSchema } from "@features/smart-cards/schemas/smartCardStepSchemas";
import type {
  FounderStepValues,
  SmartCardStepHandle,
} from "@features/smart-cards/types/smartCardForm.types";

interface FounderStepProps {
  defaultValues: FounderStepValues;
}

const FounderStep = forwardRef<
  SmartCardStepHandle<FounderStepValues>,
  FounderStepProps
>(function FounderStep({ defaultValues }, ref) {
  const {
    register,
    control,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<FounderStepValues>({
    resolver: zodResolver(founderStepSchema),
    defaultValues,
    mode: "onChange",
  });

  useImperativeHandle(ref, () => ({
    validate: async () => {
      const valid = await trigger();
      return valid ? getValues() : null;
    },
    getDraft: () => getValues(),
  }));

  return (
    <div className="flex flex-col gap-4">
      <FormTextField id="sc-founder-name" label="Founder name" icon={User} registration={register("name")} error={errors.name?.message} />
      <FormTextField id="sc-founder-title" label="Title" icon={Briefcase} registration={register("title")} error={errors.title?.message} />
      <div className="grid grid-cols-3 gap-3">
        <FormTextField id="sc-founder-experience" label="Years experience" icon={Award} inputMode="numeric" registration={register("experience")} error={errors.experience?.message} />
        <FormTextField id="sc-founder-projects" label="Projects" icon={TrendingUp} inputMode="numeric" registration={register("projects")} error={errors.projects?.message} />
        <FormTextField id="sc-founder-satisfaction" label="Satisfaction %" icon={TrendingUp} inputMode="numeric" registration={register("satisfaction")} error={errors.satisfaction?.message} />
      </div>
      <FormTextareaField id="sc-founder-intro" label="Intro" rows={3} registration={register("introText")} error={errors.introText?.message} />
      <FormTextareaField id="sc-founder-philosophy" label="Philosophy" rows={3} registration={register("philosophyText")} error={errors.philosophyText?.message} />
      <FormTextareaField id="sc-founder-quote" label="Quote" rows={2} registration={register("quote")} error={errors.quote?.message} />
      <Controller
        control={control}
        name="image"
        render={({ field }) => (
          <ImageSlotField
            label="Founder photo"
            value={field.value}
            onChange={field.onChange}
            aspect={1}
            cropShape="round"
          />
        )}
      />
    </div>
  );
});

export default FounderStep;
