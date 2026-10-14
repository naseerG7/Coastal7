
import api from "./api";

// Get background task status
export const getTaskStatus = async (taskId) => {
  const response = await api.get(`/tasks/${taskId}`);
  return response.data;
};

// Trigger invoice generation
export const generateInvoice = async (orderId) => {
  const response = await api.post(`/orders/${orderId}/invoice`);
  return response.data;
};

// Download the generated invoice PDF
export const downloadInvoice = async (orderId) => {
  const response = await api.get(
    `/orders/${orderId}/invoice/download`,
    { responseType: "blob" }
  );

  return response.data;
};

// Upload CSV for bulk product import
export const bulkImportCsv = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(
    "/products/bulk-import-csv",
    formData
  );

  return response.data;
};
