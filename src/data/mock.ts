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

export const INSTAGRAM_POSTS = [
  { id: 'ig1', image_url: 'https://picsum.photos/seed/insta1/400/400', caption: 'Layering season is here ✨', post_url: 'https://www.instagram.com/velourajewels.co_/' },
  { id: 'ig2', image_url: 'https://picsum.photos/seed/insta2/400/400', caption: 'New arrival: Gold cuff ✨', post_url: 'https://www.instagram.com/velourajewels.co_/' },
  { id: 'ig3', image_url: 'https://picsum.photos/seed/insta3/400/400', caption: 'Statement pieces 💫', post_url: 'https://www.instagram.com/velourajewels.co_/' },
  { id: 'ig4', image_url: 'https://picsum.photos/seed/insta4/400/400', caption: 'Stack & layer 💛', post_url: 'https://www.instagram.com/velourajewels.co_/' },
  { id: 'ig5', image_url: 'https://picsum.photos/seed/insta5/400/400', caption: 'For him ⛓️', post_url: 'https://www.instagram.com/velourajewels.co_/' },
  { id: 'ig6', image_url: 'https://picsum.photos/seed/insta6/400/400', caption: 'Minimal edit 🤍', post_url: 'https://www.instagram.com/velourajewels.co_/' },
];
