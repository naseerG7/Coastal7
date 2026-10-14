import api from "./api";

import type {
  Cart,
  CartActionResponse,
} from "../types/cart";

// ============================================================
// GET CART
// ============================================================

export const getCart = async (): Promise<Cart> => {
  const response = await api.get<Cart>("/cart");

  return response.data;
};

// ============================================================
// ADD PRODUCT TO CART
// ============================================================

export const addToCart = async (
  productId: number,
  quantity: number = 1
): Promise<CartActionResponse> => {
  const response = await api.post<CartActionResponse>(
    "/cart/items",
    {
      product_id: productId,
      quantity,
    }
  );

  return response.data;
};

// ============================================================
// UPDATE CART ITEM QUANTITY
// ============================================================

export const updateCartItem = async (
  itemId: number,
  quantity: number
): Promise<Cart> => {
  const response = await api.put<Cart>(
    `/cart/items/${itemId}`,
    {
      quantity,
    }
  );

  return response.data;
};

// ============================================================
// REMOVE CART ITEM
// ============================================================

export const removeFromCart = async (
  itemId: number
): Promise<Cart> => {
  const response = await api.delete<Cart>(
    `/cart/items/${itemId}`
  );

  return response.data;
};