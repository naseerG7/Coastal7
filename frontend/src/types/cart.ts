export interface CartItem {
  id: number;
  product_id: number;
  name: string;
  description: string | null;
  category: string;
  price: number;
  stock: number;
  image_url: string | null;
  quantity: number;
  item_total: number;
}

export interface Cart {
  id: number;
  user_id: number;
  items: CartItem[];
  total: number;
}

export interface CartActionResponse {
  message: string;
  cart_item_id?: number;
  product_id?: number;
  quantity?: number;
  item_id?: number;
}