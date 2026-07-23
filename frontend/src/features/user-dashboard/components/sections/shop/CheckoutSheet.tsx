import { useEffect, useState, useCallback } from "react";
import { useCheckout } from "@features/user-dashboard/hooks/useCheckout";
import { ADDRESSES_MAX } from "@features/user-dashboard/config";
import type { Cart } from "@features/user-dashboard/types";
import AddressCard from "./AddressCard";
import AddressFormSheet from "./AddressFormSheet";

interface CheckoutSheetProps {
  open: boolean;
  cart: Cart;
  onClose: () => void;
  onOrderPlaced: () => void;
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutSheet({
  open,
  cart,
  onClose,
  onOrderPlaced,
}: CheckoutSheetProps) {
  const checkout = useCheckout();
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

  useEffect(() => {
    if (open) {
      checkout.reset();
      void checkout.loadAddresses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selectedAddress = checkout.addresses.find(
    (a) => a.id === checkout.selectedAddressId,
  );

  async function handleSaveAddress(
    payload: Parameters<typeof checkout.createAddress>[0],
  ) {
    const created = await checkout.createAddress(payload);
    if (created) setShowAddressForm(false);
  }

  const handlePayNow = useCallback(async () => {
    setPaymentError(null);
    setIsPaymentLoading(true);

    try {
      // Step 1 — place the order
      const order = await checkout.placeOrder();
      if (!order) {
        setIsPaymentLoading(false);
        return;
      }

      // Step 2 — create a Razorpay order
      const paymentDetails = await checkout.initiatePayment(order.id);
      if (!paymentDetails) {
        setIsPaymentLoading(false);
        return;
      }

      // Step 3 — load Razorpay SDK and open checkout
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setPaymentError("Failed to load payment gateway. Please try again.");
        setIsPaymentLoading(false);
        return;
      }

      setIsPaymentLoading(false);

      const rzp = new window.Razorpay({
        key: paymentDetails.keyId,
        amount: paymentDetails.amount,
        currency: paymentDetails.currency,
        name: "BizViz Cards",
        order_id: paymentDetails.razorpayOrderId,
        prefill: {
          name: paymentDetails.buyerName,
          email: paymentDetails.buyerEmail,
        },
        theme: { color: "var(--color-primary)" },
        modal: {
          ondismiss: () => {
            setPaymentError("Payment was cancelled. You can try again.");
          },
        },
        handler: (response) => {
          void (async () => {
            const verified = await checkout.verifyPayment({
              orderId: order.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            if (verified) onOrderPlaced();
          })();
        },
      });

      rzp.open();
    } catch {
      setPaymentError("Something went wrong. Please try again.");
      setIsPaymentLoading(false);
    }
  }, [checkout, onOrderPlaced]);

  function handleClose() {
    onClose();
  }

  if (!open) return null;

  const isBusy =
    isPaymentLoading ||
    checkout.isPlacingOrder ||
    checkout.isInitiatingPayment ||
    checkout.isVerifyingPayment;

  const combinedError =
    paymentError ??
    checkout.placeOrderError ??
    checkout.initiatePaymentError ??
    checkout.verifyPaymentError;

  return (
    <>
      <dialog className="modal modal-bottom sm:modal-middle" open>
        <div className="modal-box p-0 overflow-hidden sm:max-w-lg rounded-t-3xl rounded-b-none sm:rounded-2xl">
          <div className="flex flex-col max-h-[92dvh]">
            {/* Drag handle (mobile) */}
            <div className="flex justify-center pt-3 pb-1 shrink-0 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-base-300" />
            </div>

            {checkout.step === "confirmed" ? (
              <ConfirmedStep
                orderId={checkout.placedOrder?.id ?? ""}
                totalAmount={checkout.placedOrder?.totalAmount ?? cart.totalAmount}
                onClose={handleClose}
              />
            ) : (
              <>
                {/* Header */}
                <div className="shrink-0 flex items-center gap-3 px-5 pt-4 pb-4 border-b border-base-200">
                  <button
                    type="button"
                    onClick={
                      checkout.step === "review"
                        ? () => checkout.setStep("address")
                        : handleClose
                    }
                    aria-label="Back"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-base-200 text-base-content/60"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                      <path
                        d="M19 12H5M12 19l-7-7 7-7"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-base-content">
                      {checkout.step === "address" ? "Delivery Address" : "Review & Pay"}
                    </p>
                    <p className="text-xs text-base-content/50">
                      {checkout.step === "address"
                        ? "Choose where to deliver"
                        : "Confirm and complete payment"}
                    </p>
                  </div>
                  {/* Step indicator */}
                  <div className="flex items-center gap-1 shrink-0">
                    <div className={`h-1.5 w-6 rounded-full transition-colors ${checkout.step === "address" ? "bg-primary" : "bg-base-300"}`} />
                    <div className={`h-1.5 w-6 rounded-full transition-colors ${checkout.step === "review" ? "bg-primary" : "bg-base-300"}`} />
                  </div>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-5 flex flex-col gap-4 pb-6">
                  {checkout.step === "address" && (
                    <AddressStep
                      addresses={checkout.addresses}
                      addressesLoading={checkout.addressesLoading}
                      addressesError={checkout.addressesError}
                      selectedAddressId={checkout.selectedAddressId}
                      onSelect={checkout.setSelectedAddressId}
                      onAddNew={() => setShowAddressForm(true)}
                      canAddMore={checkout.addresses.length < ADDRESSES_MAX}
                      onContinue={() => checkout.setStep("review")}
                    />
                  )}

                  {checkout.step === "review" && (
                    <ReviewStep
                      cart={cart}
                      selectedAddress={selectedAddress}
                      isBusy={isBusy}
                      error={combinedError}
                      onPayNow={() => void handlePayNow()}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        <div
          className="modal-backdrop"
          onClick={checkout.step === "confirmed" ? handleClose : undefined}
        />
      </dialog>

      <AddressFormSheet
        open={showAddressForm}
        onClose={() => setShowAddressForm(false)}
        onSave={handleSaveAddress}
        isSaving={checkout.createAddressLoading}
        error={checkout.createAddressError}
      />
    </>
  );
}

// ── Address Step ──────────────────────────────────────────────────────────────

interface AddressStepProps {
  addresses: ReturnType<typeof useCheckout>["addresses"];
  addressesLoading: boolean;
  addressesError: string | null;
  selectedAddressId: string | null;
  onSelect: (id: string) => void;
  onAddNew: () => void;
  canAddMore: boolean;
  onContinue: () => void;
}

function AddressStep({
  addresses,
  addressesLoading,
  addressesError,
  selectedAddressId,
  onSelect,
  onAddNew,
  canAddMore,
  onContinue,
}: AddressStepProps) {
  if (addressesLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="skeleton h-24 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (addressesError) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-sm text-error">{addressesError}</p>
      </div>
    );
  }

  return (
    <>
      {addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-base-200">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-base-content/40" aria-hidden="true">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-base-content/70">No addresses saved</p>
            <p className="mt-1 text-xs text-base-content/40">Add an address to continue</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              selected={address.id === selectedAddressId}
              onSelect={() => onSelect(address.id)}
            />
          ))}
        </div>
      )}

      {canAddMore && (
        <button
          type="button"
          onClick={onAddNew}
          className="flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-dashed border-base-300 bg-base-100 text-sm text-base-content hover:bg-base-200"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Add new address
        </button>
      )}

      <button
        type="button"
        onClick={onContinue}
        disabled={!selectedAddressId}
        className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-content hover:opacity-90 disabled:opacity-50 mt-2"
      >
        Continue to Review
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
          <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </>
  );
}

// ── Review Step ───────────────────────────────────────────────────────────────

interface ReviewStepProps {
  cart: Cart;
  selectedAddress: ReturnType<typeof useCheckout>["addresses"][number] | undefined;
  isBusy: boolean;
  error: string | null;
  onPayNow: () => void;
}

function ReviewStep({
  cart,
  selectedAddress,
  isBusy,
  error,
  onPayNow,
}: ReviewStepProps) {
  return (
    <>
      {/* Delivery address summary */}
      {selectedAddress && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/40">
            Delivering to
          </p>
          <div className="rounded-2xl border border-base-300 bg-base-100 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-primary" aria-hidden="true">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-base-content">{selectedAddress.label}</p>
                <p className="text-xs text-base-content/60 mt-0.5">{selectedAddress.contactName}</p>
                <p className="text-xs text-base-content/70 mt-1 leading-relaxed">
                  {selectedAddress.line1}
                  {selectedAddress.line2 ? `, ${selectedAddress.line2}` : ""}
                  {", "}
                  {selectedAddress.city}, {selectedAddress.state} {selectedAddress.pincode}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order items */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/40">
          Items ({cart.items.length})
        </p>
        <div className="rounded-2xl border border-base-300 bg-base-100 overflow-hidden">
          {cart.items.map((item, idx) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-4 py-3 ${idx < cart.items.length - 1 ? "border-b border-base-200" : ""}`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-base-content truncate">{item.productName}</p>
                {item.variantName && (
                  <p className="text-xs text-base-content/50">{item.variantName}</p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-base-content">
                  ₹{item.lineTotal.toFixed(2)}
                </p>
                <p className="text-xs text-base-content/40">
                  ₹{item.unitPrice.toFixed(2)} × {item.quantity}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="rounded-2xl bg-base-200 px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-medium text-base-content/70">Total</span>
        <span className="text-lg font-bold text-base-content">
          ₹{cart.totalAmount.toFixed(2)}
        </span>
      </div>

      {error && (
        <p className="rounded-xl bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={onPayNow}
        disabled={isBusy}
        className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-content hover:opacity-90 disabled:opacity-60"
      >
        {isBusy ? (
          <span className="loading loading-spinner loading-sm" />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
            <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
            <path d="M2 10h20" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        )}
        {isBusy ? "Processing…" : `Pay ₹${cart.totalAmount.toFixed(2)}`}
      </button>
    </>
  );
}

// ── Confirmed Step ────────────────────────────────────────────────────────────

interface ConfirmedStepProps {
  orderId: string;
  totalAmount: number;
  onClose: () => void;
}

function ConfirmedStep({ orderId, totalAmount, onClose }: ConfirmedStepProps) {
  const shortId = orderId.slice(0, 8).toUpperCase();

  return (
    <div className="flex flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/15">
        <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10 text-success" aria-hidden="true">
          <path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xl font-bold text-base-content">Payment Successful!</p>
        <p className="text-sm text-base-content/60">
          Your order has been confirmed and is being processed.
        </p>
      </div>

      <div className="rounded-2xl border border-base-300 bg-base-100 px-6 py-4 w-full">
        <p className="text-xs text-base-content/40 uppercase tracking-wide">Order ID</p>
        <p className="mt-1 font-mono text-sm font-bold text-base-content">{shortId}</p>
        <p className="mt-2 text-xs text-base-content/50">Amount paid</p>
        <p className="text-base font-bold text-primary">₹{totalAmount.toFixed(2)}</p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="flex min-h-12 w-full items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-content hover:opacity-90"
      >
        Continue Shopping
      </button>
    </div>
  );
}
