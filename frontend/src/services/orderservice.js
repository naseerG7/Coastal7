import api from "./api";


// =========================================================
// CREATE ORDER
// =========================================================

export const createOrder = async () => {
  const response = await api.post("/orders/");
  return response.data;
};


// =========================================================
// GET MY ORDERS
// =========================================================

export const getMyOrders = async () => {
  const response = await api.get(
    "/orders/my-orders"
  );

  return response.data;
};


// =========================================================
// GET SINGLE ORDER
// =========================================================

export const getMyOrder = async (orderId) => {
  const response = await api.get(
    `/orders/my-orders/${orderId}`
  );

  return response.data;
};


// =========================================================
// CANCEL ORDER
// =========================================================

export const cancelMyOrder = async (orderId) => {
  const response = await api.put(
    `/orders/my-orders/${orderId}/cancel`
  );

  return response.data;
};