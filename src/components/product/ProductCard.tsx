import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import { ImageFallback } from '@/components/shared/ImageFallback';

interface Props {
  product: Product;
}

export function ProductCard({ product }: Props) {
  const { addItem } = useCart();
  const mainImage = product.images.find((i) => i.is_main) || product.images[0];

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group"
    >
      <Link to={`/product/${product.slug}`} className="block">
        <div className="relative overflow-hidden rounded-2xl bg-card shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl">
          <div className="relative aspect-square overflow-hidden">
            <ImageFallback
              src={mainImage?.url}
              alt={mainImage?.alt_text || product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              variant="product"
            />

            {product.is_on_sale && product.discount_pct && (
              <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 font-body text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                Sale {product.discount_pct}%
              </span>
            )}

            <button
              className="absolute right-3 top-3 rounded-full bg-card/80 p-2 opacity-0 backdrop-blur-sm transition-all hover:bg-card group-hover:opacity-100"
              aria-label="Add to wishlist"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
              <Heart className="h-4 w-4" />
            </button>

            <div className="absolute inset-x-0 bottom-0 translate-y-full transition-transform duration-300 group-hover:translate-y-0">
              <button
                onClick={handleAddToCart}
                className="flex w-full items-center justify-center gap-2 bg-primary py-3 font-body text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <ShoppingBag className="h-4 w-4" />
                Add to Cart
              </button>
            </div>
          </div>

          {/* Gold divider */}
          <div className="h-px bg-primary/20" />

          <div className="p-4">
            {product.category && (
              <span className="font-body text-[10px] font-medium uppercase tracking-[0.15em] text-primary">
                {product.category.name}
              </span>
            )}
            <h3 className="mt-1 font-display text-sm font-semibold leading-snug text-foreground">
              {product.name}
            </h3>
            <div className="mt-2 flex items-center gap-2">
              <span className="font-body text-base font-semibold text-primary">
                Rs. {product.price.toLocaleString()}
              </span>
              {product.original_price && (
                <span className="font-body text-xs text-muted-foreground line-through">
                  Rs. {product.original_price.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
