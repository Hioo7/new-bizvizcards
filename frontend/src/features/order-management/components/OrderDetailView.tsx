import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  History,
  Mail,
  MapPin,
  Package,
  Phone,
  User,
} from "lucide-react";
import { useAsyncAction } from "@hooks/useAsyncAction";
import FormErrorRibbon from "@components/forms/FormErrorRibbon";
import ConfirmActionModal from "@components/ConfirmActionModal";
import { ROUTES } from "@config/routes";
import type { OrderStatus } from "@app-types/order.types";
import { useOrderDetail } from "@features/order-management/hooks/useOrderDetail";
import { useOrderDetailMutations } from "@features/order-management/hooks/useOrderDetailMutations";
import OrderStatusBadge from "@features/order-management/components/OrderStatusBadge";
import {
  ORDER_DESTRUCTIVE_STATUSES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TRANSITIONS,
} from "@features/order-management/config/orderManagement.config";

export default function OrderDetailView() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const detail = useOrderDetail(orderId ?? "");
  const mutations = useOrderDetailMutations(detail.refetch);

  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const statusAction = useAsyncAction();

  if (!orderId) return null;

  const handleConfirmStatusChange = () => {
    if (!pendingStatus) return;
    void statusAction.run(
      async () => {
        await mutations.updateStatus(orderId, pendingStatus);
      },
      () => setPendingStatus(null),
    );
  };

  if (detail.isLoading) {
    return (
      <div className="flex justify-center py-24">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (detail.error || !detail.order) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-8 sm:px-6">
        <button
          type="button"
          onClick={() => navigate(ROUTES.adminOrders)}
          className="flex items-center gap-1.5 text-sm text-base-content/60 hover:text-base-content"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <FormErrorRibbon message={detail.error ?? "Order not found."} />
      </div>
    );
  }

  const { order } = detail;
  const availableTransitions = ORDER_STATUS_TRANSITIONS[order.status];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <button
        type="button"
        onClick={() => navigate(ROUTES.adminOrders)}
        className="flex items-center gap-1.5 text-sm text-base-content/60 hover:text-base-content"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to orders
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-base-content">
            Order #{order.id.slice(0, 8)}
          </h1>
          <p className="text-sm text-base-content/60">
            Placed {new Date(order.placedAt).toLocaleString()}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <section className="flex flex-col gap-3 rounded-box border border-base-300 bg-base-100 p-4">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-base-content/60">
          <User className="h-3.5 w-3.5" />
          Buyer
        </p>
        <div className="flex flex-col gap-1 text-sm text-base-content">
          <p className="font-semibold">{order.buyerName}</p>
          <p className="flex items-center gap-1.5 text-base-content/70">
            <Mail className="h-3.5 w-3.5" />
            {order.buyerEmail}
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-box border border-base-300 bg-base-100 p-4">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-base-content/60">
          <MapPin className="h-3.5 w-3.5" />
          Shipping address
        </p>
        <div className="flex flex-col gap-1 text-sm text-base-content">
          <p className="font-semibold">{order.shippingAddress.label}</p>
          <p>{order.shippingAddress.contactName}</p>
          <p className="flex items-center gap-1.5 text-base-content/70">
            <Phone className="h-3.5 w-3.5" />
            {order.shippingAddress.contactPhoneCountryDialCode}{" "}
            {order.shippingAddress.contactPhoneNumber}
          </p>
          <p className="text-base-content/70">
            {order.shippingAddress.line1}
            {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
            <br />
            {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
            {order.shippingAddress.pincode}
            <br />
            {order.shippingAddress.country}
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-box border border-base-300 bg-base-100 p-4">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-base-content/60">
          <Package className="h-3.5 w-3.5" />
          Items
        </p>
        <div className="flex flex-col divide-y divide-base-300">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-base-content">
                  {item.productName}
                  {item.variantName ? ` — ${item.variantName}` : ""}
                </p>
                <p className="text-xs text-base-content/50">
                  {item.sku ? `SKU: ${item.sku} · ` : ""}
                  {item.quantity} × ₹{item.unitPrice}
                </p>
              </div>
              <p className="shrink-0 font-semibold text-base-content">₹{item.lineTotal}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-base-300 pt-3 text-sm font-bold text-base-content">
          <span>Total</span>
          <span>₹{order.totalAmount}</span>
        </div>
      </section>

      {availableTransitions.length > 0 && (
        <section className="flex flex-col gap-3 rounded-box border border-base-300 bg-base-100 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-base-content/60">
            Change status
          </p>
          <div className="flex flex-wrap gap-2">
            {availableTransitions.map((status) => {
              const isDestructive = ORDER_DESTRUCTIVE_STATUSES.includes(status);
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    statusAction.reset();
                    setPendingStatus(status);
                  }}
                  className={`flex min-h-11 items-center gap-2 rounded-field border px-4 text-sm font-semibold transition ${
                    isDestructive
                      ? "border-error/30 text-error hover:bg-error/10"
                      : "border-base-300 text-base-content hover:bg-base-200"
                  }`}
                >
                  Mark {ORDER_STATUS_LABELS[status]}
                  <ArrowRight className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-box border border-base-300 bg-base-100 p-4">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-base-content/60">
          <History className="h-3.5 w-3.5" />
          Status history
        </p>
        <div className="flex flex-col gap-2.5">
          {order.statusHistory.map((entry) => (
            <div key={entry.id} className="flex items-start justify-between gap-3 text-sm">
              <div>
                <p className="text-base-content">
                  {entry.fromStatus ? `${ORDER_STATUS_LABELS[entry.fromStatus]} → ` : ""}
                  <span className="font-semibold">
                    {ORDER_STATUS_LABELS[entry.toStatus]}
                  </span>
                </p>
                <p className="text-xs text-base-content/50">
                  {entry.changedByEmployeeName ?? "Customer checkout"}
                </p>
              </div>
              <p className="shrink-0 text-xs text-base-content/50">
                {new Date(entry.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </section>

      <ConfirmActionModal
        open={pendingStatus !== null}
        icon={ArrowRight}
        title={
          pendingStatus
            ? `Mark order as ${ORDER_STATUS_LABELS[pendingStatus]}?`
            : ""
        }
        description={
          pendingStatus && ORDER_DESTRUCTIVE_STATUSES.includes(pendingStatus)
            ? "This is a terminal status — the order can't be moved to any other stage afterward."
            : "The buyer's order stage will be updated."
        }
        confirmLabel="Confirm"
        isDestructive={pendingStatus ? ORDER_DESTRUCTIVE_STATUSES.includes(pendingStatus) : false}
        isSubmitting={statusAction.isSubmitting}
        error={statusAction.error}
        onCancel={() => setPendingStatus(null)}
        onConfirm={handleConfirmStatusChange}
      />
    </div>
  );
}
