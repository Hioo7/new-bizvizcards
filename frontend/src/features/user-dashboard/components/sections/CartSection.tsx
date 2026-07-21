import { useState, useEffect } from "react";
import { useShop } from "@features/user-dashboard/hooks/useShop";
import ShopProductCard from "./shop/ShopProductCard";
import VariantPickerSheet from "./shop/VariantPickerSheet";
import CartItemRow from "./shop/CartItemRow";
import type { ShopProduct, ShopProductVariant } from "@features/user-dashboard/types";

type ShopView = "shop" | "cart";

export default function CartSection() {
  const [view, setView] = useState<ShopView>("shop");
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const [variantPickerProduct, setVariantPickerProduct] =
    useState<ShopProduct | null>(null);

  const {
    products,
    productsLoading,
    productsError,
    loadProducts,
    cart,
    cartLoading,
    cartError,
    loadCart,
    addToCart,
    updateCartItemQuantity,
    removeCartItem,
  } = useShop();

  useEffect(() => {
    void loadProducts();
    void loadCart();
  }, [loadProducts, loadCart]);

  const cartItemCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  async function handleAddStandalone(productId: string) {
    setAddingProductId(productId);
    try {
      await addToCart({ productId, quantity: 1 });
    } catch {
      // error already set in hook
    } finally {
      setAddingProductId(null);
    }
  }

  async function handleSelectVariant(variant: ShopProductVariant) {
    setAddingProductId(variant.id);
    try {
      await addToCart({ variantId: variant.id, quantity: 1 });
      setVariantPickerProduct(null);
    } catch {
      // error already set in hook
    } finally {
      setAddingProductId(null);
    }
  }

  function renderShopContent() {
    if (productsLoading) {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 px-4 pt-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="aspect-square skeleton rounded-2xl" />
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      );
    }

    if (productsError) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 px-4 pt-20 text-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-10 w-10 text-error"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <p className="text-sm text-error font-medium">Failed to load products</p>
          <button className="btn btn-sm btn-ghost" onClick={() => void loadProducts()}>
            Try again
          </button>
        </div>
      );
    }

    if (products.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 px-4 pt-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-base-200">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-8 w-8 text-base-content/40"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z"
              />
            </svg>
          </div>
          <p className="text-sm font-semibold text-base-content">No products available</p>
          <p className="text-xs text-base-content/50">Check back soon for new products.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 px-4 pt-6">
        {products.map((product) => (
          <ShopProductCard
            key={product.id}
            product={product}
            onAddStandalone={handleAddStandalone}
            onSelectVariant={setVariantPickerProduct}
            adding={
              addingProductId === product.id ||
              product.variants.some((v) => addingProductId === v.id)
            }
          />
        ))}
      </div>
    );
  }

  function renderCartContent() {
    if (cartLoading && !cart) {
      return (
        <div className="flex flex-col px-4 pt-4 gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 py-4 border-b border-base-200">
              <div className="skeleton h-14 w-14 rounded-xl shrink-0" />
              <div className="flex-1 flex flex-col gap-2 pt-1">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
                <div className="skeleton h-8 w-24 rounded" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (cartError) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 px-4 pt-20 text-center">
          <p className="text-sm text-error font-medium">{cartError}</p>
          <button className="btn btn-sm btn-ghost" onClick={() => void loadCart()}>
            Try again
          </button>
        </div>
      );
    }

    if (!cart || cart.items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 px-4 pt-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-base-200">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-8 w-8 text-base-content/40"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-base-content">Your cart is empty</p>
            <p className="text-xs text-base-content/50 mt-1">Browse the shop and add items.</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setView("shop")}>
            Browse products
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col pb-4">
        <div className="px-4 pt-2">
          {cart.items.map((item) => (
            <CartItemRow
              key={item.id}
              item={item}
              onUpdateQuantity={updateCartItemQuantity}
              onRemove={removeCartItem}
              disabled={cartLoading}
            />
          ))}
        </div>

        {/* Total + checkout */}
        <div className="mx-4 mt-4 rounded-2xl bg-base-200 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-base-content/70">Total</span>
            <span className="text-lg font-bold text-base-content">
              ${cart.totalAmount.toFixed(2)}
            </span>
          </div>
          <button className="btn btn-primary w-full" disabled>
            Checkout — coming soon
          </button>
        </div>

        <button
          className="mx-4 mt-3 btn btn-ghost btn-sm text-base-content/50"
          onClick={() => setView("shop")}
        >
          ← Continue shopping
        </button>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-base-100 pb-24">
      {/* Blue header */}
      <header
        className="sticky top-0 z-10 px-4 pt-10 pb-5 flex items-center justify-between"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        <h1 className="text-2xl font-bold text-white">
          {view === "cart" ? "Cart" : "Shop"}
        </h1>

        {/* Cart / back button */}
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/30 text-white text-sm font-medium active:bg-white/10 transition-colors"
          onClick={() => setView(view === "cart" ? "shop" : "cart")}
          aria-label={view === "cart" ? "Back to shop" : "View cart"}
        >
          {view === "cart" ? "Shop" : "Cart"}
          {cartItemCount > 0 && view !== "cart" && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-primary text-xs font-bold">
              {cartItemCount > 99 ? "99+" : cartItemCount}
            </span>
          )}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
            aria-hidden="true"
          >
            {view === "cart" ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            )}
          </svg>
        </button>
      </header>

      {/* Content */}
      {view === "shop" ? renderShopContent() : renderCartContent()}

      {/* Variant picker sheet */}
      <VariantPickerSheet
        product={variantPickerProduct}
        onSelect={handleSelectVariant}
        onClose={() => setVariantPickerProduct(null)}
        adding={addingProductId !== null}
      />
    </section>
  );
}
