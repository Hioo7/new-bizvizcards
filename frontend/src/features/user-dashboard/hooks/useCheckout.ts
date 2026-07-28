import { useState, useCallback } from "react";
import { userDashboardService } from "@features/user-dashboard/services/UserDashboardService";
import type {
  Address,
  CreateAddressPayload,
  CustomerOrder,
  InitiatePaymentResponse,
  VerifyPaymentPayload,
} from "@features/user-dashboard/types";

export type CheckoutStep = "address" | "review" | "confirmed";

export interface UseCheckoutReturn {
  step: CheckoutStep;
  setStep: (step: CheckoutStep) => void;
  // Addresses
  addresses: Address[];
  addressesLoading: boolean;
  addressesError: string | null;
  loadAddresses: () => Promise<void>;
  selectedAddressId: string | null;
  setSelectedAddressId: (id: string) => void;
  // Create address
  createAddress: (payload: CreateAddressPayload) => Promise<Address | null>;
  createAddressLoading: boolean;
  createAddressError: string | null;
  // Place order
  placeOrder: () => Promise<CustomerOrder | null>;
  isPlacingOrder: boolean;
  placeOrderError: string | null;
  placedOrder: CustomerOrder | null;
  // Payment
  initiatePayment: (orderId: string) => Promise<InitiatePaymentResponse | null>;
  isInitiatingPayment: boolean;
  initiatePaymentError: string | null;
  verifyPayment: (payload: VerifyPaymentPayload) => Promise<boolean>;
  isVerifyingPayment: boolean;
  verifyPaymentError: string | null;
  // Reset
  reset: () => void;
}

export function useCheckout(): UseCheckoutReturn {
  const [step, setStep] = useState<CheckoutStep>("address");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressesError, setAddressesError] = useState<string | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [createAddressLoading, setCreateAddressLoading] = useState(false);
  const [createAddressError, setCreateAddressError] = useState<string | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [placeOrderError, setPlaceOrderError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<CustomerOrder | null>(null);
  const [isInitiatingPayment, setIsInitiatingPayment] = useState(false);
  const [initiatePaymentError, setInitiatePaymentError] = useState<string | null>(null);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [verifyPaymentError, setVerifyPaymentError] = useState<string | null>(null);

  const loadAddresses = useCallback(async () => {
    setAddressesLoading(true);
    setAddressesError(null);
    try {
      const result = await userDashboardService.listAddresses();
      setAddresses(result);
      const defaultAddr = result.find((a) => a.isDefault) ?? result[0] ?? null;
      if (defaultAddr) setSelectedAddressId(defaultAddr.id);
    } catch (err) {
      setAddressesError(
        err instanceof Error ? err.message : "Failed to load addresses",
      );
    } finally {
      setAddressesLoading(false);
    }
  }, []);

  const createAddress = useCallback(
    async (payload: CreateAddressPayload): Promise<Address | null> => {
      setCreateAddressLoading(true);
      setCreateAddressError(null);
      try {
        const created = await userDashboardService.createAddress(payload);
        setAddresses((prev) => [...prev, created]);
        setSelectedAddressId(created.id);
        return created;
      } catch (err) {
        setCreateAddressError(
          err instanceof Error ? err.message : "Failed to save address",
        );
        return null;
      } finally {
        setCreateAddressLoading(false);
      }
    },
    [],
  );

  const placeOrder = useCallback(async (): Promise<CustomerOrder | null> => {
    if (!selectedAddressId) return null;
    setIsPlacingOrder(true);
    setPlaceOrderError(null);
    try {
      const order = await userDashboardService.placeOrder({
        addressId: selectedAddressId,
      });
      setPlacedOrder(order);
      return order;
    } catch (err) {
      setPlaceOrderError(
        err instanceof Error ? err.message : "Failed to place order",
      );
      return null;
    } finally {
      setIsPlacingOrder(false);
    }
  }, [selectedAddressId]);

  const initiatePayment = useCallback(
    async (orderId: string): Promise<InitiatePaymentResponse | null> => {
      setIsInitiatingPayment(true);
      setInitiatePaymentError(null);
      try {
        return await userDashboardService.initiatePayment(orderId);
      } catch (err) {
        setInitiatePaymentError(
          err instanceof Error ? err.message : "Failed to initiate payment",
        );
        return null;
      } finally {
        setIsInitiatingPayment(false);
      }
    },
    [],
  );

  const verifyPayment = useCallback(
    async (payload: VerifyPaymentPayload): Promise<boolean> => {
      setIsVerifyingPayment(true);
      setVerifyPaymentError(null);
      try {
        await userDashboardService.verifyPayment(payload);
        setStep("confirmed");
        return true;
      } catch (err) {
        setVerifyPaymentError(
          err instanceof Error ? err.message : "Payment verification failed",
        );
        return false;
      } finally {
        setIsVerifyingPayment(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setStep("address");
    setSelectedAddressId(null);
    setPlacedOrder(null);
    setPlaceOrderError(null);
    setCreateAddressError(null);
    setInitiatePaymentError(null);
    setVerifyPaymentError(null);
  }, []);

  return {
    step,
    setStep,
    addresses,
    addressesLoading,
    addressesError,
    loadAddresses,
    selectedAddressId,
    setSelectedAddressId,
    createAddress,
    createAddressLoading,
    createAddressError,
    placeOrder,
    isPlacingOrder,
    placeOrderError,
    placedOrder,
    initiatePayment,
    isInitiatingPayment,
    initiatePaymentError,
    verifyPayment,
    isVerifyingPayment,
    verifyPaymentError,
    reset,
  };
}
