import api from "./api";
import type { Product } from "../types/products";

export interface ProductCreateData {
  name: string;
  category: string;
  description?: string | null;
  price: number;
  stock: number;
}

export interface ProductUpdateData {
  name?: string;
  category?: string;
  description?: string | null;
  price?: number;
  stock?: number;
}

// GET ALL PRODUCTS
export const getProducts = async (
  category: string = ""
): Promise<Product[]> => {
  const response = await api.get<Product[]>("/products/", {
    params: category ? { category } : {},
  });

  return response.data;
};

// GET SINGLE PRODUCT
export const getProduct = async (
  productId: number
): Promise<Product> => {
  const response = await api.get<Product>(
    `/products/${productId}`
  );

  return response.data;
};

// CREATE PRODUCT
export const createProduct = async (
  productData: ProductCreateData
): Promise<Product> => {
  const response = await api.post<Product>(
    "/products/",
    productData
  );

  return response.data;
};

// UPDATE PRODUCT
export const updateProduct = async (
  productId: number,
  productData: ProductUpdateData
): Promise<Product> => {
  const response = await api.put<Product>(
    `/products/${productId}`,
    productData
  );

  return response.data;
};

// DELETE PRODUCT
export const deleteProduct = async (
  productId: number
): Promise<{
  message: string;
  product_id: number;
}> => {
  const response = await api.delete<{
    message: string;
    product_id: number;
  }>(`/products/${productId}`);

  return response.data;
};

// INCREASE PRODUCT STOCK
export const increaseProductStock = async (
  productId: number,
  quantity: number
): Promise<Product> => {
  const response = await api.post<Product>(
    `/products/${productId}/increase-stock`,
    null,
    {
      params: {
        quantity,
      },
    }
  );

  return response.data;
};

// UPLOAD / UPDATE PRODUCT IMAGE
export const uploadProductImage = async (
  productId: number,
  file: File
): Promise<Product> => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await api.post<Product>(
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