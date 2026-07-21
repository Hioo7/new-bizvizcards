import { useState, useCallback } from "react";
import { userDashboardService } from "@features/user-dashboard/services/UserDashboardService";
import { SHOP_PAGE_SIZE } from "@features/user-dashboard/config";
import type {
  ShopProduct,
  Cart,
  AddToCartPayload,
} from "@features/user-dashboard/types";

interface UseShopReturn {
  // Products
  products: ShopProduct[];
  productsLoading: boolean;
  productsError: string | null;
  loadProducts: () => Promise<void>;
  // Cart
  cart: Cart | null;
  cartLoading: boolean;
  cartError: string | null;
  loadCart: () => Promise<void>;
  addToCart: (payload: AddToCartPayload) => Promise<void>;
  updateCartItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeCartItem: (itemId: string) => Promise<void>;
}

export function useShop(): UseShopReturn {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [cart, setCart] = useState<Cart | null>(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const res = await userDashboardService.listShopProducts(1, SHOP_PAGE_SIZE);
      setProducts(res.products);
    } catch (err) {
      setProductsError(
        err instanceof Error ? err.message : "Failed to load products",
      );
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const loadCart = useCallback(async () => {
    setCartLoading(true);
    setCartError(null);
    try {
      const fetched = await userDashboardService.getCart();
      setCart(fetched);
    } catch (err) {
      setCartError(
        err instanceof Error ? err.message : "Failed to load cart",
      );
    } finally {
      setCartLoading(false);
    }
  }, []);

  const addToCart = useCallback(async (payload: AddToCartPayload) => {
    setCartLoading(true);
    setCartError(null);
    try {
      const updated = await userDashboardService.addToCart(payload);
      setCart(updated);
    } catch (err) {
      setCartError(
        err instanceof Error ? err.message : "Failed to add item to cart",
      );
      throw err;
    } finally {
      setCartLoading(false);
    }
  }, []);

  const updateCartItemQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      setCartLoading(true);
      setCartError(null);
      try {
        const updated = await userDashboardService.updateCartItem(itemId, {
          quantity,
        });
        setCart(updated);
      } catch (err) {
        setCartError(
          err instanceof Error ? err.message : "Failed to update item",
        );
      } finally {
        setCartLoading(false);
      }
    },
    [],
  );

  const removeCartItem = useCallback(async (itemId: string) => {
    setCartLoading(true);
    setCartError(null);
    try {
      const updated = await userDashboardService.removeCartItem(itemId);
      setCart(updated);
    } catch (err) {
      setCartError(
        err instanceof Error ? err.message : "Failed to remove item",
      );
    } finally {
      setCartLoading(false);
    }
  }, []);

  return {
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
  };
}
