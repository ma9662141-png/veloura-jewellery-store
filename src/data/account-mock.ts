import type { Product } from '@/types';
import { PRODUCTS } from './mock';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  gender: 'female' | 'male' | 'unisex';
  avatar_url?: string;
  total_orders: number;
  total_spent: number;
  created_at: string;
}

export interface UserOrder {
  id: string;
  order_number: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: UserOrderItem[];
  subtotal: number;
  delivery_fee: number;
  discount_amount: number;
  total: number;
  payment_method: string;
  delivery_city: string;
  delivery_address: string;
  tracking_number?: string;
  created_at: string;
}

export interface UserOrderItem {
  id: string;
  product_name: string;
  variant_name?: string;
  image_url: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface WishlistItem {
  id: string;
  product: Product;
  created_at: string;
}

export interface UserAddress {
  id: string;
  label: string;
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  postal_code?: string;
  is_default: boolean;
}

export const MOCK_PROFILE: UserProfile = {
  id: 'u1',
  full_name: 'Ayesha Khan',
  email: 'ayesha@example.com',
  phone: '+923001234567',
  city: 'Lahore',
  gender: 'female',
  total_orders: 7,
  total_spent: 12500,
  created_at: '2024-11-01T00:00:00Z',
};

export const MOCK_ORDERS: UserOrder[] = [
  {
    id: 'o1', order_number: 'VJ-1042', status: 'delivered',
    items: [
      { id: 'oi1', product_name: 'Celestial Band Ring', image_url: PRODUCTS[0].images[0].url, unit_price: 850, quantity: 1, line_total: 850 },
      { id: 'oi2', product_name: 'Pearl Drop Earrings', image_url: PRODUCTS[1].images[0].url, unit_price: 950, quantity: 2, line_total: 1900 },
    ],
    subtotal: 2750, delivery_fee: 0, discount_amount: 275, total: 2475,
    payment_method: 'cod', delivery_city: 'Lahore', delivery_address: '123 Model Town',
    tracking_number: 'TCS-98234', created_at: '2025-01-15T10:30:00Z',
  },
  {
    id: 'o2', order_number: 'VJ-1058', status: 'shipped',
    items: [
      { id: 'oi3', product_name: 'Layered Chain Necklace', image_url: PRODUCTS[2].images[0].url, unit_price: 1450, quantity: 1, line_total: 1450 },
    ],
    subtotal: 1450, delivery_fee: 150, discount_amount: 0, total: 1600,
    payment_method: 'jazzcash', delivery_city: 'Lahore', delivery_address: '123 Model Town',
    tracking_number: 'LEO-44521', created_at: '2025-02-20T14:00:00Z',
  },
  {
    id: 'o3', order_number: 'VJ-1071', status: 'confirmed',
    items: [
      { id: 'oi4', product_name: 'Gold Cuff Bracelet', image_url: PRODUCTS[3].images[0].url, unit_price: 1100, quantity: 1, line_total: 1100 },
      { id: 'oi5', product_name: 'Crystal Stud Earrings', image_url: PRODUCTS[10].images[0].url, unit_price: 550, quantity: 1, line_total: 550 },
    ],
    subtotal: 1650, delivery_fee: 0, discount_amount: 0, total: 1650,
    payment_method: 'easypaisa', delivery_city: 'Karachi', delivery_address: '45 Defence, Phase 5',
    created_at: '2025-03-01T09:00:00Z',
  },
  {
    id: 'o4', order_number: 'VJ-1085', status: 'pending',
    items: [
      { id: 'oi6', product_name: 'Minimal Jewellery Set', image_url: PRODUCTS[4].images[0].url, unit_price: 2800, quantity: 1, line_total: 2800 },
    ],
    subtotal: 2800, delivery_fee: 0, discount_amount: 350, total: 2450,
    payment_method: 'cod', delivery_city: 'Islamabad', delivery_address: '12 F-7 Markaz',
    created_at: '2025-03-06T16:45:00Z',
  },
];

export const MOCK_WISHLIST: WishlistItem[] = [
  { id: 'w1', product: PRODUCTS[4], created_at: '2025-02-10' },
  { id: 'w2', product: PRODUCTS[5], created_at: '2025-02-14' },
  { id: 'w3', product: PRODUCTS[8], created_at: '2025-02-28' },
  { id: 'w4', product: PRODUCTS[11], created_at: '2025-03-02' },
];

export const MOCK_ADDRESSES: UserAddress[] = [
  { id: 'a1', label: 'Home', full_name: 'Ayesha Khan', phone: '+923001234567', address_line: '123 Model Town, Block C', city: 'Lahore', postal_code: '54700', is_default: true },
  { id: 'a2', label: 'Office', full_name: 'Ayesha Khan', phone: '+923009876543', address_line: '45 Mall Road, Suite 3B', city: 'Lahore', postal_code: '54000', is_default: false },
];

export const PAKISTANI_CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
  'Peshawar', 'Quetta', 'Multan', 'Sialkot', 'Hyderabad',
  'Gujranwala', 'Bahawalpur', 'Sargodha', 'Abbottabad', 'Mardan',
];

export const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; step: number }> = {
  pending:    { label: 'Pending',    color: 'bg-amber-100 text-amber-700 border-amber-200',   step: 0 },
  confirmed:  { label: 'Confirmed',  color: 'bg-blue-100 text-blue-700 border-blue-200',     step: 1 },
  processing: { label: 'Processing', color: 'bg-purple-100 text-purple-700 border-purple-200', step: 2 },
  shipped:    { label: 'Shipped',    color: 'bg-indigo-100 text-indigo-700 border-indigo-200', step: 3 },
  delivered:  { label: 'Delivered',  color: 'bg-emerald-100 text-emerald-700 border-emerald-200', step: 4 },
  cancelled:  { label: 'Cancelled',  color: 'bg-red-100 text-red-700 border-red-200',         step: -1 },
};
