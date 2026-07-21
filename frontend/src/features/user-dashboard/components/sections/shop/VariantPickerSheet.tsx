import { useEffect, useRef } from "react";
import type { ShopProduct, ShopProductVariant } from "@features/user-dashboard/types";

interface Props {
  product: ShopProduct | null;
  onSelect: (variant: ShopProductVariant) => void;
  onClose: () => void;
  adding: boolean;
}

export default function VariantPickerSheet({
  product,
  onSelect,
  onClose,
  adding,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (product) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [product]);

  if (!product) return null;

  return (
    <dialog ref={dialogRef} className="modal modal-bottom sm:modal-middle" onClose={onClose}>
      <div className="modal-box">
        <div className="flex items-center gap-3 mb-4">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-5 w-5 text-primary shrink-0"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
          <h3 className="font-bold text-base">Choose a variant</h3>
        </div>
        <p className="text-sm text-base-content/70 mb-4">{product.name}</p>
        <ul className="flex flex-col gap-2">
          {product.variants.map((variant) => (
            <li key={variant.id}>
              <button
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-base-200 hover:bg-primary/10 transition-colors"
                onClick={() => onSelect(variant)}
                disabled={adding}
              >
                <span className="text-sm font-medium text-base-content">
                  {variant.name}
                </span>
                <span className="text-sm font-bold text-primary">
                  ${variant.price.toFixed(2)}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="modal-action mt-4">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
