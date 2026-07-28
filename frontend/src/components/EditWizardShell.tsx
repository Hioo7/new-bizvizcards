import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import FormStepShell, {
  type FormStepDefinition,
} from "@components/forms/FormStepShell";

interface EditWizardShellProps {
  open: boolean;
  icon: LucideIcon;
  title: string;
  accentColor?: "primary" | "secondary";
  steps: FormStepDefinition[];
  currentIndex: number;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onBack: () => void;
  onNext: () => void;
  children: ReactNode;
}

// Multi-step counterpart to EditSheetShell — same portal-to-<body> reasoning
// (a sheet's own children can open a nested native <dialog>), with
// FormStepShell driving the step chrome/nav instead of a single-shot footer.
export default function EditWizardShell({
  open,
  icon,
  title,
  accentColor = "primary",
  steps,
  currentIndex,
  isSubmitting,
  error,
  onClose,
  onBack,
  onNext,
  children,
}: EditWizardShellProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, [onClose]);

  return createPortal(
    <dialog ref={dialogRef} className="modal modal-bottom sm:modal-middle">
      <div className="modal-box flex h-[92vh] w-full flex-col overflow-hidden p-0 sm:h-[85vh] sm:max-w-lg">
        <FormStepShell
          icon={icon}
          title={title}
          accentColor={accentColor}
          steps={steps}
          currentIndex={currentIndex}
          isSubmitting={isSubmitting}
          error={error}
          onBack={onBack}
          onNext={onNext}
          onCancel={onClose}
        >
          {children}
        </FormStepShell>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>,
    document.body,
  );
}
