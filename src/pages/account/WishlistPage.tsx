import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface WishlistProduct {
  id: string;
  wishlist_id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number | null;
  is_on_sale: boolean;
  category_name: string | null;
  main_image: string | null;
}

export default function WishlistPage() {
  const { user } = useAuth();
  const { addItem } = useCart();
  const [items, setItems] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('wishlists')
      .select(`
        id,
        product_id,
        products(id, name, slug, price, original_price, is_on_sale, stock_qty, rating_avg, rating_count, gender, status, low_stock_alert,
          categories(name),
          product_images(url)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const mapped = (data || []).map((w: any) => ({
          id: w.products?.id,
          wishlist_id: w.id,
          name: w.products?.name || '',
          slug: w.products?.slug || '',
          price: w.products?.price || 0,
          original_price: w.products?.original_price,
          is_on_sale: w.products?.is_on_sale || false,
          category_name: w.products?.categories?.name || null,
          main_image: w.products?.product_images?.[0]?.url || null,
        }));
        setItems(mapped);
        setLoading(false);
      });
  }, [user]);

  const removeFromWishlist = async (wishlistId: string) => {
    const { error } = await supabase.from('wishlists').delete().eq('id', wishlistId);
    if (error) { toast.error(error.message); return; }
    setItems(prev => prev.filter(i => i.wishlist_id !== wishlistId));
    toast.success('Removed from wishlist');
  };

  const handleAddToCart = (item: WishlistProduct) => {
    addItem({
      id: item.id,
      name: item.name,
      slug: item.slug,
      price: item.price,
      original_price: item.original_price ?? undefined,
      is_on_sale: item.is_on_sale,
      stock_qty: 10,
      low_stock_alert: 5,
      rating_avg: 0,
      rating_count: 0,
      gender: 'unisex',
      status: 'active',
      created_at: '',
      updated_at: '',
      images: item.main_image ? [{ id: '1', url: item.main_image, sort_order: 0, is_main: true }] : [],
    });
    toast.success(`${item.name} added to cart`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="aspect-square rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold md:text-3xl">Wishlist</h1>
        <span className="font-body text-sm text-muted-foreground">{items.length} item{items.length !== 1 ? 's' : ''}</span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl bg-card p-12 text-center shadow-sm">
          <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="mb-4 font-body text-muted-foreground">Your wishlist is empty</p>
          <Button asChild className="rounded-full font-body text-sm">
            <Link to="/shop">Browse Products</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {items.map(item => (
              <motion.div
                key={item.wishlist_id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group overflow-hidden rounded-xl bg-card shadow-sm"
              >
                <Link to={`/product/${item.slug}`} className="block">
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    {item.main_image && (
                      <img
                        src={item.main_image}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                    {item.is_on_sale && (
                      <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 font-body text-[10px] font-semibold text-primary-foreground">
                        SALE
                      </span>
                    )}
                  </div>
                </Link>
                <div className="p-3 space-y-2">
                  {item.category_name && (
                    <p className="font-body text-xs text-muted-foreground uppercase tracking-wider">
                      {item.category_name}
                    </p>
                  )}
                  <h3 className="font-body text-sm font-medium line-clamp-1">{item.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="font-body text-sm font-semibold text-primary">Rs. {item.price.toLocaleString()}</span>
                    {item.original_price && (
                      <span className="font-body text-xs text-muted-foreground line-through">Rs. {item.original_price.toLocaleString()}</span>
                    )}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="flex-1 rounded-full font-body text-xs"
                      onClick={() => handleAddToCart(item)}
                    >
                      <ShoppingCart className="mr-1 h-3 w-3" /> Add to Cart
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full px-2"
                      onClick={() => removeFromWishlist(item.wishlist_id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
