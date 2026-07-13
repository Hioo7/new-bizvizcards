import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Download, MessageCircle, Phone } from "lucide-react";
import FormTextField from "@components/forms/FormTextField";
import ComponentEditSheetShell from "@features/ecards/components/ComponentEditSheetShell";
import {
  whatsappSheetSchema,
  type WhatsAppSheetValues,
} from "@features/ecards/schemas/ecardComponentSchemas";
import type {
  EcardHeroDraft,
  WhatsAppComponentDraft,
} from "@features/ecards/types/ecardBuilder.types";

interface WhatsAppEditSheetProps {
  open: boolean;
  draft: WhatsAppComponentDraft;
  heroPhone: Pick<EcardHeroDraft, "phoneCountryDialCode" | "phoneNumber">;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (draft: WhatsAppComponentDraft) => void;
}

export default function WhatsAppEditSheet({
  open,
  draft,
  heroPhone,
  isSubmitting,
  error,
  onClose,
  onSave,
}: WhatsAppEditSheetProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<WhatsAppSheetValues>({
    resolver: zodResolver(whatsappSheetSchema),
    defaultValues: {
      phoneCountryDialCode: draft.phoneCountryDialCode,
      phoneNumber: draft.phoneNumber,
    },
  });

  const canImportFromHero = Boolean(heroPhone.phoneCountryDialCode && heroPhone.phoneNumber);

  function importFromHero() {
    setValue("phoneCountryDialCode", heroPhone.phoneCountryDialCode, {
      shouldValidate: true,
    });
    setValue("phoneNumber", heroPhone.phoneNumber, { shouldValidate: true });
  }

  function submit(values: WhatsAppSheetValues) {
    onSave({ type: "WHATSAPP", ...values });
  }

  return (
    <ComponentEditSheetShell
      open={open}
      icon={MessageCircle}
      title="WhatsApp"
      onClose={onClose}
      onSave={() => void handleSubmit(submit)()}
      isSubmitting={isSubmitting}
      error={error}
    >
      <p className="text-sm text-base-content/60">
        Visitors who tap this card open a WhatsApp chat with this number.
      </p>
      <div className="flex items-end gap-2">
        <div className="w-24">
          <FormTextField
            id="whatsapp-dial-code"
            label="Dial code"
            icon={Phone}
            registration={register("phoneCountryDialCode")}
            error={errors.phoneCountryDialCode?.message}
          />
        </div>
        <div className="flex-1">
          <FormTextField
            id="whatsapp-phone-number"
            label="Phone number"
            icon={Phone}
            registration={register("phoneNumber")}
            error={errors.phoneNumber?.message}
          />
        </div>
        <button
          type="button"
          onClick={importFromHero}
          disabled={!canImportFromHero}
          aria-label="Import phone number from Hero"
          title="Import phone number from Hero"
          className="mb-[1px] flex h-11 w-11 shrink-0 items-center justify-center rounded-field border border-base-300 bg-base-100 text-base-content hover:bg-base-200 disabled:opacity-40"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>
    </ComponentEditSheetShell>
  );
}
