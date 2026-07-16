import { useEffect, useRef, useState } from "react";
import { CreditCard, RotateCcw, X } from "lucide-react";
import type { Customer } from "@app-types/customer";
import { useAsyncAction } from "@hooks/useAsyncAction";
import FormErrorRibbon from "@components/forms/FormErrorRibbon";
import { useCustomerPlanDetail } from "@features/plans/hooks/useCustomerPlanDetail";
import { useCustomerPlanMutations } from "@features/plans/hooks/useCustomerPlanMutations";
import PlanPicker from "@features/plans/components/customer-plan/PlanPicker";
import PlanPurchaseHistoryTable from "@features/plans/components/customer-plan/PlanPurchaseHistoryTable";

interface CustomerPlanModalProps {
  customer: Customer | null;
  open: boolean;
  onCancel: () => void;
}

export default function CustomerPlanModal({
  customer,
  open,
  onCancel,
}: CustomerPlanModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");

  const detail = useCustomerPlanDetail(open ? (customer?.id ?? null) : null);
  const mutations = useCustomerPlanMutations(detail.refetch);

  const assignAction = useAsyncAction();
  const switchAction = useAsyncAction();
  const renewAction = useAsyncAction();
  const cancelAction = useAsyncAction();
  const { reset: resetAssign } = assignAction;
  const { reset: resetSwitch } = switchAction;
  const { reset: resetRenew } = renewAction;
  const { reset: resetCancel } = cancelAction;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setSelectedPlanId("");
      resetAssign();
      resetSwitch();
      resetRenew();
      resetCancel();
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, resetAssign, resetSwitch, resetRenew, resetCancel]);

  if (!customer) return null;

  function handleAssign() {
    if (!customer || !selectedPlanId) return;
    void assignAction.run(
      () => mutations.assign(customer.id, selectedPlanId),
      () => setSelectedPlanId(""),
    );
  }

  function handleSwitch() {
    if (!customer || !selectedPlanId) return;
    void switchAction.run(
      () => mutations.switchPlan(customer.id, selectedPlanId),
      () => setSelectedPlanId(""),
    );
  }

  function handleRenew() {
    if (!customer) return;
    void renewAction.run(() => mutations.renew(customer.id), () => undefined);
  }

  function handleCancel() {
    if (!customer) return;
    void cancelAction.run(() => mutations.cancel(customer.id), () => undefined);
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal modal-bottom sm:modal-middle"
      onClose={onCancel}
    >
      <div className="modal-box flex h-[85vh] w-full flex-col overflow-hidden p-0 sm:h-[75vh] sm:max-w-lg">
        <div className="shrink-0 border-b border-base-300 px-4 pt-4 pb-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold text-base-content">
                Plan — {customer.name}
              </h3>
              <p className="text-sm text-base-content/60">{customer.email}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {detail.isLoading && (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-lg text-primary" />
            </div>
          )}

          {!detail.isLoading && detail.error && (
            <FormErrorRibbon message={detail.error} />
          )}

          {!detail.isLoading && !detail.error && detail.status && (
            <div className="flex flex-col gap-5">
              <div className="rounded-box border border-base-300 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
                  Current plan
                </p>
                <p className="mt-1 text-base font-semibold text-base-content">
                  {detail.status.planName}
                  {detail.status.isFallback && (
                    <span className="ml-2 rounded-full bg-warning/10 px-2 py-0.5 text-xs font-semibold text-warning">
                      Fallback (no active plan)
                    </span>
                  )}
                </p>

                {!detail.status.isFallback && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleRenew}
                      disabled={renewAction.isSubmitting}
                      className="btn btn-sm min-h-9 gap-1.5 rounded-field border border-base-300 bg-base-100 text-base-content hover:bg-base-200"
                    >
                      {renewAction.isSubmitting ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        <RotateCcw className="h-3.5 w-3.5" />
                      )}
                      Renew
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={cancelAction.isSubmitting}
                      className="btn btn-sm min-h-9 gap-1.5 rounded-field border border-error/30 bg-error/10 text-error hover:bg-error/20"
                    >
                      {cancelAction.isSubmitting ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                      Cancel plan
                    </button>
                  </div>
                )}
                {renewAction.error && (
                  <p className="mt-2 text-xs text-error">{renewAction.error}</p>
                )}
                {cancelAction.error && (
                  <p className="mt-2 text-xs text-error">{cancelAction.error}</p>
                )}
              </div>

              <div className="rounded-box border border-base-300 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50">
                  {detail.status.isFallback ? "Assign a plan" : "Switch to a different plan"}
                </p>
                <PlanPicker
                  value={selectedPlanId}
                  onChange={setSelectedPlanId}
                  excludePlanId={
                    detail.status.isFallback ? undefined : detail.status.planId
                  }
                />
                <button
                  type="button"
                  onClick={detail.status.isFallback ? handleAssign : handleSwitch}
                  disabled={
                    !selectedPlanId ||
                    assignAction.isSubmitting ||
                    switchAction.isSubmitting
                  }
                  className="btn mt-3 min-h-11 w-full gap-2 rounded-field bg-primary text-primary-content hover:bg-primary/90"
                >
                  {(assignAction.isSubmitting || switchAction.isSubmitting) && (
                    <span className="loading loading-spinner loading-sm" />
                  )}
                  {detail.status.isFallback ? "Assign plan" : "Switch plan"}
                </button>
                {(assignAction.error || switchAction.error) && (
                  <p className="mt-2 text-xs text-error">
                    {assignAction.error ?? switchAction.error}
                  </p>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50">
                  Purchase history
                </p>
                <PlanPurchaseHistoryTable history={detail.history} />
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-base-300 bg-base-100 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onCancel}
            className="btn min-h-11 rounded-field border border-base-300 bg-base-100 text-base-content hover:bg-base-200"
          >
            Close
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>
  );
}
