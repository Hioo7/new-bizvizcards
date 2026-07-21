import { CART_ITEM_MAX_QUANTITY } from "@features/user-dashboard/config";
import type { CartItem } from "@features/user-dashboard/types";

interface Props {
  item: CartItem;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  disabled: boolean;
}

export default function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
  disabled,
}: Props) {
  return (
    <div className="flex gap-3 py-4 border-b border-base-200 last:border-0">
      {/* Product icon placeholder */}
      <div className="shrink-0 h-14 w-14 rounded-xl bg-base-200 flex items-center justify-center">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-6 w-6 text-base-content/30"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
          />
        </svg>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-base-content truncate">
          {item.productName}
        </p>
        {item.variantName && (
          <p className="text-xs text-base-content/60 truncate">
            {item.variantName}
          </p>
        )}
        <p className="text-xs text-base-content/60 mt-0.5">
          ${item.unitPrice.toFixed(2)} each
        </p>

        {/* Quantity stepper */}
        <div className="flex items-center gap-2 mt-2">
          <button
            className="btn btn-ghost btn-xs h-8 w-8 min-h-0 p-0 rounded-lg border border-base-300"
            onClick={() =>
              item.quantity > 1
                ? onUpdateQuantity(item.id, item.quantity - 1)
                : onRemove(item.id)
            }
            disabled={disabled}
            aria-label="Decrease quantity"
          >
            {item.quantity === 1 ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 text-error" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
              </svg>
            )}
          </button>
          <span className="text-sm font-semibold w-6 text-center text-base-content">
            {item.quantity}
          </span>
          <button
            className="btn btn-ghost btn-xs h-8 w-8 min-h-0 p-0 rounded-lg border border-base-300"
            onClick={() =>
              onUpdateQuantity(item.id, item.quantity + 1)
            }
            disabled={disabled || item.quantity >= CART_ITEM_MAX_QUANTITY}
            aria-label="Increase quantity"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Line total */}
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-base-content">
          ${item.lineTotal.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
