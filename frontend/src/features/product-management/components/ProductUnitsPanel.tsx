import { useState } from "react";
import { CheckCircle2, Link2, Plus, Printer } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAsyncAction } from "@hooks/useAsyncAction";
import FormErrorRibbon from "@components/forms/FormErrorRibbon";
import ConfirmActionModal from "@components/ConfirmActionModal";
import type { PrintBatchResult } from "@app-types/product.types";
import { useProductUnitsSummary } from "@features/product-management/hooks/useProductUnitsSummary";
import { useProductUnitsActions } from "@features/product-management/hooks/useProductUnitsActions";
import GenerateUnitsForm from "@features/product-management/components/GenerateUnitsForm";
import CreatePrintBatchForm from "@features/product-management/components/CreatePrintBatchForm";
import PrintBatchResultModal from "@features/product-management/components/PrintBatchResultModal";

interface ProductUnitsPanelProps {
  productId?: string;
  variantId?: string;
}

export default function ProductUnitsPanel({ productId, variantId }: ProductUnitsPanelProps) {
  const summary = useProductUnitsSummary({ productId, variantId });
  const actions = useProductUnitsActions({ productId, variantId }, summary.refetch);
  const generateAction = useAsyncAction();
  const printBatchAction = useAsyncAction();
  const [pendingGenerateQuantity, setPendingGenerateQuantity] = useState<number | null>(
    null,
  );
  const [pendingPrintQuantity, setPendingPrintQuantity] = useState<number | null>(null);
  const [printBatchResult, setPrintBatchResult] = useState<PrintBatchResult | null>(null);

  const handleConfirmGenerate = () => {
    if (pendingGenerateQuantity === null) return;
    void generateAction.run(
      () => actions.generateUnits(pendingGenerateQuantity),
      () => setPendingGenerateQuantity(null),
    );
  };

  const handleConfirmPrintBatch = () => {
    if (pendingPrintQuantity === null) return;
    void printBatchAction.run(
      async () => {
        const result = await actions.createPrintBatch({
          productId,
          variantId,
          quantity: pendingPrintQuantity,
        });
        setPrintBatchResult(result);
      },
      () => setPendingPrintQuantity(null),
    );
  };

  return (
    <div className="flex flex-col gap-5">
      {summary.error && <FormErrorRibbon message={summary.error} />}

      {summary.isLoading ? (
        <span className="loading loading-spinner loading-sm self-center text-primary" />
      ) : (
        summary.summary && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <UnitStat label="Total" value={summary.summary.total} />
            <UnitStat
              label="Unprinted"
              value={summary.summary.unprinted}
              icon={Printer}
              tone="warning"
            />
            <UnitStat
              label="Printed"
              value={summary.summary.printed}
              icon={CheckCircle2}
              tone="success"
            />
            <UnitStat
              label="Linked"
              value={summary.summary.linked}
              icon={Link2}
              tone="primary"
            />
          </div>
        )
      )}

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-base-content/60">Add to stock</p>
        <GenerateUnitsForm onRequestGenerate={setPendingGenerateQuantity} />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-base-content/60">
          Send to manufacturer
        </p>
        <CreatePrintBatchForm
          maxQuantity={summary.summary?.unprinted ?? 0}
          onRequestPrintBatch={setPendingPrintQuantity}
        />
      </div>

      <ConfirmActionModal
        open={pendingGenerateQuantity !== null}
        icon={Plus}
        title={`Generate ${pendingGenerateQuantity ?? 0} unit${pendingGenerateQuantity === 1 ? "" : "s"}?`}
        description="This creates new physical unit codes, ready to send to print whenever you like."
        confirmLabel="Generate"
        isSubmitting={generateAction.isSubmitting}
        error={generateAction.error}
        onCancel={() => setPendingGenerateQuantity(null)}
        onConfirm={handleConfirmGenerate}
      />

      <ConfirmActionModal
        open={pendingPrintQuantity !== null}
        icon={Printer}
        title={`Send ${pendingPrintQuantity ?? 0} unit${pendingPrintQuantity === 1 ? "" : "s"} to print?`}
        description="These units will be marked as printed and won't be included in another batch."
        confirmLabel="Send to print"
        isSubmitting={printBatchAction.isSubmitting}
        error={printBatchAction.error}
        onCancel={() => setPendingPrintQuantity(null)}
        onConfirm={handleConfirmPrintBatch}
      />

      <PrintBatchResultModal
        open={printBatchResult !== null}
        result={printBatchResult}
        onClose={() => setPrintBatchResult(null)}
      />
    </div>
  );
}

const STAT_TONE_CLASSES: Record<"neutral" | "warning" | "success" | "primary", string> = {
  neutral: "bg-base-200 text-base-content/40",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
  primary: "bg-primary/10 text-primary",
};

function UnitStat({
  label,
  value,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: number;
  icon?: LucideIcon;
  tone?: "neutral" | "warning" | "success" | "primary";
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1 rounded-field px-2 py-3 text-center ${STAT_TONE_CLASSES[tone]}`}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      <p className="text-lg font-bold text-base-content">{value}</p>
      <p className="text-[10px] uppercase tracking-wide opacity-70">{label}</p>
    </div>
  );
}
