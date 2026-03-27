import type { Product, Category, Review } from '@/types';
import categoryRings from '@/assets/category-rings.jpg';
import categoryEarrings from '@/assets/category-earrings.jpg';
import categoryNecklaces from '@/assets/category-necklaces.jpg';
import categoryBracelets from '@/assets/category-bracelets.jpg';
import categorySets from '@/assets/category-sets.jpg';
import categoryMen from '@/assets/category-men.jpg';

export const STORE_SETTINGS = {
  store_name: 'Veloura Jewels',
  store_tagline: 'Your Story, Set in Stone ✨',
  whatsapp_number: '+923075323246',
  instagram_handle: '@velourajewels.co_',
  free_delivery_above: 1500,
  standard_delivery_fee: 150,
  estimated_delivery: '3–5 working days',
  announcement_text: '✨ Free delivery on orders above Rs. 1,500 — Shop Now!',
  announcement_active: true,
};

export const CATEGORIES: Category[] = [
  { id: '1', name: 'Rings', slug: 'rings', emoji: '💍', image_url: categoryRings, sort_order: 1, is_active: true, description: 'Elegant rings for every occasion' },
  { id: '2', name: 'Earrings', slug: 'earrings', emoji: '✨', image_url: categoryEarrings, sort_order: 2, is_active: true, description: 'Statement & everyday earrings' },
  { id: '3', name: 'Necklaces', slug: 'necklaces', emoji: '📿', image_url: categoryNecklaces, sort_order: 3, is_active: true, description: 'Chains, pendants & chokers' },
  { id: '4', name: 'Bracelets & Bangles', slug: 'bracelets', emoji: '💛', image_url: categoryBracelets, sort_order: 4, is_active: true, description: 'Stack & layer your wrists' },
  { id: '5', name: 'Jewellery Sets', slug: 'sets', emoji: '🪙', image_url: categorySets, sort_order: 5, is_active: true, description: 'Complete matching sets' },
  { id: '6', name: 'For Him', slug: 'for-him', emoji: '⛓️', image_url: categoryMen, sort_order: 6, is_active: true, description: 'Bold masculine pieces' },
];

const PRODUCT_IMAGES: [string, string][] = [
  // Rings
  ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=600&h=600&fit=crop'],
  // Earrings
  ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&h=600&fit=crop'],
  // Necklaces
  ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=600&h=600&fit=crop'],
  // Bracelets
  ['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=600&h=600&fit=crop'],
  // Sets
  ['https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1595177085659-c6b9f16a5d5a?w=600&h=600&fit=crop'],
  // Men chain
  ['https://images.unsplash.com/photo-1574169208507-84376144848b?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=600&fit=crop'],
  // Ring 2
  ['https://images.unsplash.com/photo-1589128777073-263566ae5e4d?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=600&fit=crop'],
  // Hoops
  ['https://images.unsplash.com/photo-1630019852942-f89202989a59?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=600&fit=crop'],
  // Pendant
  ['https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=600&fit=crop'],
  // Beaded bracelet
  ['https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=600&fit=crop'],
  // Studs
  ['https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=600&h=600&fit=crop'],
  // Choker
  ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=600&fit=crop', 'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=600&h=600&fit=crop'],
];

const makeProduct = (i: number, cat: number, name: string, price: number, originalPrice?: number): Product => ({
  id: `p${i}`,
  name,
  slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
  category_id: `${cat}`,
  gender: cat === 6 ? 'male' : 'unisex',
  status: 'active',
  price,
  original_price: originalPrice,
  is_on_sale: !!originalPrice,
  discount_pct: originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : undefined,
  stock_qty: 15 + i * 3,
  low_stock_alert: 10,
  rating_avg: 4.2 + (i % 5) * 0.15,
  rating_count: 8 + i * 2,
  description: `Beautiful ${name.toLowerCase()} crafted with premium quality materials. Perfect for everyday wear or special occasions.`,
  material_care: 'Alloy base with anti-tarnish coating. Avoid contact with water and perfume.',
  shipping_info: '3–5 working days · Pakistan-wide delivery',
  tags: ['bestseller'],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  images: [
    { id: `img${i}a`, url: PRODUCT_IMAGES[i - 1][0], alt_text: name, sort_order: 0, is_main: true },
    { id: `img${i}b`, url: PRODUCT_IMAGES[i - 1][1], alt_text: `${name} detail`, sort_order: 1, is_main: false },
  ],
  category: CATEGORIES[cat - 1],
});

export const PRODUCTS: Product[] = [
  makeProduct(1, 1, 'Celestial Band Ring', 850, 1200),
  makeProduct(2, 2, 'Pearl Drop Earrings', 950),
  makeProduct(3, 3, 'Layered Chain Necklace', 1450, 1800),
  makeProduct(4, 4, 'Gold Cuff Bracelet', 1100),
  makeProduct(5, 5, 'Minimal Jewellery Set', 2800, 3500),
  makeProduct(6, 6, 'Cuban Link Chain', 1650),
  makeProduct(7, 1, 'Twisted Signet Ring', 750, 950),
  makeProduct(8, 2, 'Hoop Earrings Gold', 680),
  makeProduct(9, 3, 'Pendant Heart Necklace', 1250),
  makeProduct(10, 4, 'Beaded Bracelet Set', 990, 1400),
  makeProduct(11, 2, 'Crystal Stud Earrings', 550),
  makeProduct(12, 3, 'Snake Chain Choker', 1100, 1350),
];

export const REVIEWS: Review[] = [
  { id: 'r1', rating: 5, title: 'Absolutely stunning!', body: 'The quality exceeded my expectations. Got so many compliments at the wedding!', is_verified: true, created_at: '2025-01-15', user: { full_name: 'Ayesha K.', city: 'Lahore' } },
  { id: 'r2', rating: 5, title: 'Perfect gift', body: 'Ordered for my sister\'s birthday and she loved it. Packaging was beautiful too.', is_verified: true, created_at: '2025-02-01', user: { full_name: 'Sara M.', city: 'Karachi' } },
  { id: 'r3', rating: 4, title: 'Great value for money', body: 'Beautiful pieces at such affordable prices. Will definitely order again!', is_verified: true, created_at: '2025-02-20', user: { full_name: 'Fatima R.', city: 'Islamabad' } },
];

export const INSTAGRAM_POSTS = [
  { id: 'ig1', image_url: 'https://picsum.photos/seed/insta1/400/400', caption: 'Layering season is here ✨', post_url: 'https://www.instagram.com/velourajewels.co_/' },
  { id: 'ig2', image_url: 'https://picsum.photos/seed/insta2/400/400', caption: 'New arrival: Gold cuff ✨', post_url: 'https://www.instagram.com/velourajewels.co_/' },
  { id: 'ig3', image_url: 'https://picsum.photos/seed/insta3/400/400', caption: 'Statement pieces 💫', post_url: 'https://www.instagram.com/velourajewels.co_/' },
  { id: 'ig4', image_url: 'https://picsum.photos/seed/insta4/400/400', caption: 'Stack & layer 💛', post_url: 'https://www.instagram.com/velourajewels.co_/' },
  { id: 'ig5', image_url: 'https://picsum.photos/seed/insta5/400/400', caption: 'For him ⛓️', post_url: 'https://www.instagram.com/velourajewels.co_/' },
  { id: 'ig6', image_url: 'https://picsum.photos/seed/insta6/400/400', caption: 'Minimal edit 🤍', post_url: 'https://www.instagram.com/velourajewels.co_/' },
];
