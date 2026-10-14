import api from "./api";

// =========================================================
// GET USER'S CART
// =========================================================

export const getCart = async () => {
  const response = await api.get("/cart");
  return response.data;
};

// =========================================================
// ADD ITEM TO CART
// =========================================================

export const addToCart = async (productId, quantity = 1) => {
  const response = await api.post("/cart/items", {
    product_id: productId,
    quantity,
  });
  return response.data;
};

// =========================================================
// UPDATE CART ITEM QUANTITY
// =========================================================

export const updateCartItem = async (cartItemId, quantity) => {
  const response = await api.put(`/cart/items/${cartItemId}`, {
    quantity,
  });
  return response.data;
};

// =========================================================
// REMOVE ITEM FROM CART
// =========================================================

export const removeFromCart = async (cartItemId) => {
  const response = await api.delete(`/cart/items/${cartItemId}`);
  return response.data;
};

