import api from "./api";

// =========================================================
// GET ALL PRODUCTS (WITH FTS & FUZZY SEARCH)
// =========================================================

export const getProducts = async (paramsOrCategory = {}) => {
  let params = {};

  if (typeof paramsOrCategory === "string") {
    if (paramsOrCategory && paramsOrCategory !== "All") {
      params.category = paramsOrCategory;
    }
  } else if (paramsOrCategory && typeof paramsOrCategory === "object") {
    params = { ...paramsOrCategory };
    if (params.category === "All") {
      delete params.category;
    }
  }

  const response = await api.get("/products/", { params });
  return Array.isArray(response.data) ? response.data : [];
};

// =========================================================
// GET SINGLE PRODUCT
// =========================================================

export const getProduct = async (productId) => {
  const response = await api.get(`/products/${productId}`);
  return response.data;
};

// =========================================================
// CREATE PRODUCT
// =========================================================

export const createProduct = async (productData) => {
  const response = await api.post("/products/", productData);
  return response.data;
};

// =========================================================
// UPDATE PRODUCT
// =========================================================

export const updateProduct = async (productId, productData) => {
  const response = await api.put(`/products/${productId}`, productData);
  return response.data;
};

// =========================================================
// DELETE PRODUCT
// =========================================================

export const deleteProduct = async (productId) => {
  const response = await api.delete(`/products/${productId}`);
  return response.data;
};

// =========================================================
// INCREASE STOCK
// =========================================================

export const increaseProductStock = async (productId, quantity) => {
  const response = await api.post(
    `/products/${productId}/increase-stock`,
    null,
    { params: { quantity } }
  );
  return response.data;
};

// =========================================================
// UPLOAD PRODUCT IMAGE
// =========================================================

export const uploadProductImage = async (productId, file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(
    `/products/${productId}/image`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

// =========================================================
// BULK IMPORT PRODUCTS VIA CSV (CELERY TASK)
// =========================================================

export const bulkImportProducts = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(
    "/products/bulk-import-csv",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};
// Upload multiple additional product gallery images
export const uploadProductImages = async (productId, files) => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await api.post(
    `/products/${productId}/images`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};
