export interface Product {
  id: string;
  name: string;
  price: number;
  sale_price?: number | null;
  image_url: string;
  images?: string[];
  image_alt_texts?: string[];
  category: string;
  subcategory?: string;
  color?: string;
  brand?: string;
  description: string;
  sizes: string[];
  in_stock: boolean;
  is_new: boolean;
  is_on_sale: boolean;
  created_at: string;
  updated_at: string;
  measurements?: Record<string, Record<string, string>>;
  stock_quantity?: Record<string, number>;
}

export interface CartItem {
  product: Product;
  quantity: number;
  size: string;
}

export interface User {
  name: string;
  email: string;
}