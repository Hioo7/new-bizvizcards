import { forwardRef, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, MapPin, Phone } from "lucide-react";
import FormTextField from "@components/forms/FormTextField";
import { contactStepSchema } from "@features/smart-cards/schemas/smartCardStepSchemas";
import type {
  ContactStepValues,
  SmartCardStepHandle,
} from "@features/smart-cards/types/smartCardForm.types";

interface ContactStepProps {
  defaultValues: ContactStepValues;
}

const ContactStep = forwardRef<
  SmartCardStepHandle<ContactStepValues>,
  ContactStepProps
>(function ContactStep({ defaultValues }, ref) {
  const {
    register,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<ContactStepValues>({
    resolver: zodResolver(contactStepSchema),
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
      <FormTextField
        id="sc-contact-number"
        label="Phone number"
        icon={Phone}
        registration={register("contactNumber")}
        error={errors.contactNumber?.message}
      />
      <FormTextField
        id="sc-contact-email"
        label="Email"
        icon={Mail}
        type="email"
        registration={register("email")}
        error={errors.email?.message}
      />
      <FormTextField
        id="sc-contact-address"
        label="Address"
        icon={MapPin}
        registration={register("address")}
        error={errors.address?.message}
      />
    </div>
  );
});

export default ContactStep;
