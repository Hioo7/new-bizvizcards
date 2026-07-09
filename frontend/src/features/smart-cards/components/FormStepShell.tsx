import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import FormErrorRibbon from "@components/forms/FormErrorRibbon";

export interface FormStepDefinition {
  id: string;
  label: string;
}

interface FormStepShellProps {
  icon: LucideIcon;
  title: string;
  accentColor: "primary" | "secondary";
  steps: FormStepDefinition[];
  currentIndex: number;
  isSubmitting: boolean;
  error: string | null;
  onBack: () => void;
  onNext: () => void;
  onCancel: () => void;
  children: ReactNode;
}

const ACCENT_CLASSES: Record<
  FormStepShellProps["accentColor"],
  { bar: string; badge: string; button: string }
> = {
  primary: {
    bar: "bg-primary",
    badge: "bg-primary/10 text-primary",
    button: "bg-primary text-primary-content hover:bg-primary/90",
  },
  secondary: {
    bar: "bg-secondary",
    badge: "bg-secondary/10 text-secondary",
    button: "bg-secondary text-secondary-content hover:bg-secondary/90",
  },
};

export default function FormStepShell({
  icon: Icon,
  title,
  accentColor,
  steps,
  currentIndex,
  isSubmitting,
  error,
  onBack,
  onNext,
  onCancel,
  children,
}: FormStepShellProps) {
  const accent = ACCENT_CLASSES[accentColor];
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === steps.length - 1;
  const currentStep = steps[currentIndex];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-base-300 px-4 pt-4 pb-3 sm:px-6">
        <div className="flex items-center gap-3">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${accent.badge}`}>
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-extrabold text-base-content">{title}</h1>
            <p className="text-sm text-base-content/60">
              Step {currentIndex + 1} of {steps.length}: {currentStep.label}
            </p>
          </div>
        </div>

        <div className="mt-3 hidden items-center gap-2 sm:flex">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-1 flex-col gap-1.5">
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  index <= currentIndex ? accent.bar : "bg-base-300"
                }`}
              />
              <span
                className={`truncate text-[10px] font-semibold uppercase tracking-wide ${
                  index === currentIndex ? "text-base-content" : "text-base-content/40"
                }`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-base-300 sm:hidden">
          <div
            className={`h-1.5 rounded-full transition-all ${accent.bar}`}
            style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>

      {error && (
        <div className="shrink-0 px-4 pb-2 sm:px-6">
          <FormErrorRibbon message={error} />
        </div>
      )}

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-base-300 bg-base-100 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={isFirstStep ? onCancel : onBack}
          disabled={isSubmitting}
          className="btn min-h-11 gap-2 rounded-field border border-base-300 bg-base-100 text-base-content hover:bg-base-200"
        >
          {isFirstStep ? (
            <>
              <X className="h-4 w-4" />
              Cancel
            </>
          ) : (
            <>
              <ArrowLeft className="h-4 w-4" />
              Back
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={isSubmitting}
          className={`btn min-h-11 gap-2 rounded-field ${accent.button}`}
        >
          {isSubmitting && <span className="loading loading-spinner loading-sm" />}
          {isLastStep ? (
            <>
              <Check className="h-4 w-4" />
              Save
            </>
          ) : (
            <>
              Next
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
