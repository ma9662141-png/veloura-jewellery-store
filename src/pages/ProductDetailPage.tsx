import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Heart, ShoppingBag, MessageCircle, Truck, RotateCcw, ShieldCheck, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductCard } from '@/components/product/ProductCard';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);

  const { data: storeSettings } = useQuery({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('store_settings').select('*').eq('id', 1).single();
      return data;
    }
  });

  const { data: product, isLoading: loadingProduct } = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data } = await supabase.from('products')
        .select('*, categories(name, slug), product_images(id, url, is_main, sort_order)')
        .eq('slug', slug)
        .eq('status', 'active')
        .single();
      if (!data) return null;
      return {
        ...data,
        images: data.product_images || [],
        category: data.categories || { name: 'Uncategorized', slug: 'uncategorized' }
      };
    },
    enabled: !!slug
  });

  const { data: related = [] } = useQuery({
    queryKey: ['related-products', product?.category_id],
    queryFn: async () => {
      if (!product?.category_id) return [];
      const { data } = await supabase.from('products')
        .select('*, categories(name, slug), product_images(url, is_main, sort_order)')
        .eq('category_id', product.category_id)
        .eq('status', 'active')
        .neq('id', product.id)
        .limit(4);
      return (data || []).map((p: any) => ({
        ...p,
        images: p.product_images || [],
        category: p.categories || { name: 'Uncategorized', slug: 'uncategorized' }
      }));
    },
    enabled: !!product?.category_id
  });

  if (loadingProduct) {
    return <div className="flex min-h-screen items-center justify-center pt-20 font-body text-muted-foreground">Loading product...</div>;
  }

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-20 font-body text-muted-foreground">
        Product not found. <Link to="/shop" className="ml-2 text-primary underline">Back to Shop</Link>
      </div>
    );
  }

  const mainImage = product.images.find((i: any) => i.is_main) || product.images[0];

  const whatsappPhone = (storeSettings?.whatsapp_number || '+923075323246').replace(/[^0-9]/g, '');
  const whatsappMsg = encodeURIComponent(
    `Hi Veloura Jewels! 👋\n\nI want to order:\n🛍️ Product: ${product.name}\n💰 Price: Rs. ${product.price?.toLocaleString()}\n\nMy details:\n📛 Name: \n📍 Address: \n📱 Phone: \n\nThank you! ✨`
  );

  const handleAddToCart = () => {
    addItem(product, undefined, quantity);
    toast.success(`${product.name} added to cart`);
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
          {/* Gallery */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-2xl bg-card">
              <img src={mainImage?.url} alt={product.name} className="h-full w-full object-cover" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(product.images || []).map((img: any) => (
                <div key={img.id} className="aspect-square cursor-pointer overflow-hidden rounded-lg border-2 border-transparent transition-colors hover:border-primary">
                  <img src={img.url} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
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
              <span className="font-body text-3xl font-bold text-primary">Rs. {product.price.toLocaleString()}</span>
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
                <ShoppingBag className="mr-2 h-4 w-4" /> Add to Cart — Rs. {(product.price * quantity).toLocaleString()}
              </Button>
              <Button variant="outline" size="lg" className="rounded-full border-primary font-body text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground">
                <Heart className="mr-2 h-4 w-4" /> Add to Wishlist
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
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
