export interface Product {
  id: number;
  name: string;
  category: string;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  created_at?: string;
  updated_at?: string;
}