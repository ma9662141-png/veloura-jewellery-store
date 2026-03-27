export interface Product {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  category_id?: string;
  collection_id?: string;
  gender: 'female' | 'male' | 'unisex';
  status: 'active' | 'draft' | 'archived';
  price: number;
  original_price?: number;
  is_on_sale: boolean;
  discount_pct?: number;
  stock_qty: number;
  low_stock_alert: number;
  description?: string;
  material_care?: string;
  shipping_info?: string;
  tags?: string[];
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
  images: ProductImage[];
  category?: Category;
  variants?: ProductVariant[];
}

export interface ProductImage {
  id: string;
  url: string;
  alt_text?: string;
  sort_order: number;
  is_main: boolean;
}

export interface ProductVariant {
  id: string;
  name: string;
  price_delta: number;
  stock_qty: number;
  is_active: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  emoji?: string;
  sort_order: number;
  is_active: boolean;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
}

export interface CartItem {
  id: string;
  product: Product;
  variant?: ProductVariant;
  quantity: number;
}

export interface Review {
  id: string;
  rating: number;
  title?: string;
  body?: string;
  is_verified: boolean;
  created_at: string;
  user?: { full_name: string; city?: string };
}

export interface StoreSettings {
  store_name: string;
  store_tagline: string;
  whatsapp_number: string;
  instagram_handle: string;
  free_delivery_above: number;
  standard_delivery_fee: number;
  estimated_delivery: string;
  announcement_text?: string;
  announcement_active: boolean;
}
