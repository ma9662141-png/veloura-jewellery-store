import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Heart, ShoppingBag, MessageCircle, Truck, RotateCcw, ShieldCheck, ChevronRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import type { Product, ProductVariant } from '@/types';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { addItem } = useCart();
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null | undefined>(undefined); // undefined = loading
  const [related, setRelated] = useState<Product[]>([]);
  const [whatsappNumber, setWhatsappNumber] = useState('+923075323246');
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);

  useEffect(() => {
    if (!slug) return;

    // Fetch product from Supabase
    supabase
      .from('products')
      .select(`
        *,
        images:product_images(id, url, alt_text, sort_order, is_main),
        category:categories(id, name, slug, emoji, sort_order, is_active),
        variants:product_variants(id, name, price_delta, stock_qty, is_active)
      `)
      .eq('slug', slug)
      .eq('status', 'active')
      .single()
      .then(({ data }) => {
        if (!data) { setProduct(null); return; }
        // Sort images by sort_order
        const sorted = { ...data, images: [...(data.images ?? [])].sort((a: any, b: any) => a.sort_order - b.sort_order) };
        setProduct(sorted as unknown as Product);
        const main = sorted.images.find((i: any) => i.is_main) || sorted.images[0];
        if (main) setSelectedImageUrl(main.url);

        // Fetch related products in same category
        if (data.category_id) {
          supabase
            .from('products')
            .select('*, images:product_images(id, url, alt_text, sort_order, is_main), category:categories(id, name, slug, emoji, sort_order, is_active)')
            .eq('category_id', data.category_id)
            .eq('status', 'active')
            .neq('id', data.id)
            .limit(4)
            .then(({ data: relData }) => setRelated((relData as unknown as Product[]) ?? []));
        }
      });

    // Fetch store whatsapp number
    supabase
      .from('store_settings')
      .select('whatsapp_number')
      .eq('id', 1)
      .single()
      .then(({ data }) => { if (data?.whatsapp_number) setWhatsappNumber(data.whatsapp_number); });
  }, [slug]);

  // Check if product is in wishlist
  useEffect(() => {
    if (!user || !product) return;
    supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', product.id)
      .single()
      .then(({ data }) => setInWishlist(!!data));
  }, [user, product]);

  // Loading state
  if (product === undefined) {
    return (
      <div className="pt-20">
        <div className="container pb-20">
          <div className="grid gap-10 md:grid-cols-2">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-20 font-body text-muted-foreground">
        Product not found. <Link to="/shop" className="ml-2 text-primary underline">Back to Shop</Link>
      </div>
    );
  }

  const activeVariants = product.variants?.filter((v) => v.is_active) ?? [];
  const displayPrice = product.price + (selectedVariant?.price_delta ?? 0);

  // Normalise phone
  const normalisePhone = (num: string) => {
    let digits = num.replace(/[^0-9]/g, '');
    if (digits.startsWith('0')) digits = '92' + digits.slice(1);
    return digits;
  };

  const whatsappPhone = normalisePhone(whatsappNumber);
  const whatsappMsg = encodeURIComponent(
    `Hi Veloura Jewels! 👋\n\nI want to order:\n🛍️ Product: ${product.name}${selectedVariant ? ` (${selectedVariant.name})` : ''}\n💰 Price: Rs. ${displayPrice.toLocaleString()}\n\nMy details:\n📛 Name: \n📍 Address: \n📱 Phone: \n\nThank you! ✨`
  );

  const handleAddToCart = () => {
    addItem(product, selectedVariant, quantity);
    toast.success(`${product.name} added to cart`);
  };

  const handleWishlist = async () => {
    if (!user) { toast.error('Please log in to save to wishlist'); return; }
    setWishlistLoading(true);
    if (inWishlist) {
      await supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', product.id);
      setInWishlist(false);
      toast.success('Removed from wishlist');
    } else {
      await supabase.from('wishlists').insert({ user_id: user.id, product_id: product.id });
      setInWishlist(true);
      toast.success('Added to wishlist ♡');
    }
    setWishlistLoading(false);
  };

  return (
    <div className="pt-20">
      {/* Breadcrumb */}
      <div className="container py-4">
        <nav className="flex items-center gap-1 font-body text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/shop" className="hover:text-primary">Shop</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{product.name}</span>
        </nav>
      </div>

      <div className="container pb-20">
        <div className="grid gap-10 md:grid-cols-2">
          {/* Gallery — Fix #14: clicking thumbnail updates main image */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-2xl bg-card">
              <img
                src={selectedImageUrl || product.images[0]?.url}
                alt={product.name}
                className="h-full w-full object-cover transition-opacity duration-200"
              />
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImageUrl(img.url)}
                    className={`aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                      selectedImageUrl === img.url ? 'border-primary' : 'border-transparent hover:border-primary/50'
                    }`}
                  >
                    <img src={img.url} alt={img.alt_text || ''} className="h-full w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
            {product.category && (
              <span className="font-body text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {product.category.name}
              </span>
            )}
            <h1 className="font-display text-3xl font-bold md:text-4xl">{product.name}</h1>

            <div className="flex items-center gap-3">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.round(product.rating_avg) ? 'fill-primary text-primary' : 'text-border'}`} />
                ))}
              </div>
              <span className="font-body text-sm text-muted-foreground">({product.rating_count} reviews)</span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="font-body text-3xl font-bold text-primary">Rs. {displayPrice.toLocaleString()}</span>
              {product.original_price && (
                <>
                  <span className="font-body text-lg text-muted-foreground line-through">Rs. {product.original_price.toLocaleString()}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 font-body text-xs font-bold text-primary">
                    {product.discount_pct}% OFF
                  </span>
                </>
              )}
            </div>

            <p className="font-body text-sm leading-relaxed text-muted-foreground">{product.description}</p>

            {/* Fix #13: Variant selection */}
            {activeVariants.length > 0 && (
              <div className="space-y-2">
                <p className="font-body text-sm font-medium">
                  Option: <span className="text-muted-foreground">{selectedVariant?.name ?? 'Select one'}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {activeVariants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(selectedVariant?.id === v.id ? undefined : v)}
                      className={`rounded-lg border px-4 py-2 font-body text-sm transition-colors ${
                        selectedVariant?.id === v.id
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {v.name}
                      {v.price_delta !== 0 && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({v.price_delta > 0 ? '+' : ''}Rs. {v.price_delta.toLocaleString()})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-3">
              <span className="font-body text-sm font-medium">Quantity:</span>
              <div className="flex items-center rounded-lg border">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2 font-body transition-colors hover:bg-muted">−</button>
                <span className="w-10 text-center font-body text-sm">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-2 font-body transition-colors hover:bg-muted">+</button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-2">
              <Button size="lg" className="rounded-full font-body text-sm font-medium" onClick={handleAddToCart}>
                <ShoppingBag className="mr-2 h-4 w-4" /> Add to Cart — Rs. {(displayPrice * quantity).toLocaleString()}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className={`rounded-full border-primary font-body text-sm font-medium ${inWishlist ? 'bg-primary/10 text-primary' : 'text-primary hover:bg-primary hover:text-primary-foreground'}`}
                onClick={handleWishlist}
                disabled={wishlistLoading}
              >
                <Heart className={`mr-2 h-4 w-4 ${inWishlist ? 'fill-primary' : ''}`} />
                {inWishlist ? 'Saved to Wishlist' : 'Add to Wishlist'}
              </Button>
              <Button asChild size="lg" className="rounded-full bg-whatsapp font-body text-sm font-medium text-primary-foreground hover:bg-whatsapp/90">
                <a href={`https://wa.me/${whatsappPhone}?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" /> Order via WhatsApp
                </a>
              </Button>
            </div>

            {/* Trust */}
            <div className="grid grid-cols-3 gap-4 rounded-xl bg-cream-dark p-4">
              {[
                { icon: Truck, text: 'Free delivery Rs.1500+' },
                { icon: RotateCcw, text: '7-day returns' },
                { icon: ShieldCheck, text: 'Authentic quality' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex flex-col items-center gap-1 text-center">
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="font-body text-[11px] text-muted-foreground">{text}</span>
                </div>
              ))}
            </div>

            {/* Accordion */}
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="details">
                <AccordionTrigger className="font-body text-sm font-medium">Product Details</AccordionTrigger>
                <AccordionContent className="font-body text-sm text-muted-foreground">{product.description}</AccordionContent>
              </AccordionItem>
              <AccordionItem value="care">
                <AccordionTrigger className="font-body text-sm font-medium">Materials & Care</AccordionTrigger>
                <AccordionContent className="font-body text-sm text-muted-foreground">{product.material_care}</AccordionContent>
              </AccordionItem>
              <AccordionItem value="shipping">
                <AccordionTrigger className="font-body text-sm font-medium">Shipping Info</AccordionTrigger>
                <AccordionContent className="font-body text-sm text-muted-foreground">{product.shipping_info}</AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-20">
            <h2 className="mb-8 font-display text-2xl font-bold">You May Also Like</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
              {related.map((p) => {
                const mainImg = p.images?.find((i) => i.is_main) || p.images?.[0];
                return (
                  <Link key={p.id} to={`/product/${p.slug}`} className="group block">
                    <div className="aspect-square overflow-hidden rounded-xl bg-muted">
                      <img src={mainImg?.url} alt={p.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    </div>
                    <div className="mt-2 px-1">
                      <p className="font-body text-sm font-medium truncate">{p.name}</p>
                      <p className="font-body text-sm text-primary font-semibold">Rs. {p.price.toLocaleString()}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
