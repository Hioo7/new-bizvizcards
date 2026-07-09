import { forwardRef, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AtSign,
  Briefcase,
  Camera,
  Globe,
  Link2,
  MapPinned,
  MessageCircle,
  ThumbsUp,
  Video,
} from "lucide-react";
import FormTextField from "@components/forms/FormTextField";
import { socialStepSchema } from "@features/smart-cards/schemas/smartCardStepSchemas";
import type {
  SmartCardStepHandle,
  SocialStepValues,
} from "@features/smart-cards/types/smartCardForm.types";

interface SocialStepProps {
  defaultValues: SocialStepValues;
}

const SocialStep = forwardRef<
  SmartCardStepHandle<SocialStepValues>,
  SocialStepProps
>(function SocialStep({ defaultValues }, ref) {
  const {
    register,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<SocialStepValues>({
    resolver: zodResolver(socialStepSchema),
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
      <FormTextField id="sc-whatsapp" label="WhatsApp" icon={MessageCircle} registration={register("whatsapp")} error={errors.whatsapp?.message} />
      <FormTextField id="sc-instagram" label="Instagram" icon={Camera} registration={register("instagram")} error={errors.instagram?.message} />
      <FormTextField id="sc-facebook" label="Facebook" icon={ThumbsUp} registration={register("facebook")} error={errors.facebook?.message} />
      <FormTextField id="sc-linkedin" label="LinkedIn" icon={Briefcase} registration={register("linkedIn")} error={errors.linkedIn?.message} />
      <FormTextField id="sc-twitter" label="Twitter / X" icon={AtSign} registration={register("twitter")} error={errors.twitter?.message} />
      <FormTextField id="sc-youtube" label="YouTube" icon={Video} registration={register("youtube")} error={errors.youtube?.message} />
      <FormTextField id="sc-google-map" label="Google Maps link" icon={MapPinned} registration={register("googleMap")} error={errors.googleMap?.message} />
      <FormTextField id="sc-website" label="Website" icon={Globe} registration={register("website")} error={errors.website?.message} />
      <FormTextField id="sc-other" label="Other link" icon={Link2} registration={register("other")} error={errors.other?.message} />
    </div>
  );
});

export default SocialStep;
