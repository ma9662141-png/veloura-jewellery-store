import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SlidersHorizontal, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@/types';

export default function ShopPage() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategory ? [initialCategory] : []);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [sortBy, setSortBy] = useState('featured');
  const [onSaleOnly, setOnSaleOnly] = useState(false);

  // Live categories from Supabase
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug, emoji, image_url, is_active')
        .eq('is_active', true)
        .order('sort_order');
      return data ?? [];
    },
  });

  // Live products from Supabase
  const { data: products, isLoading } = useQuery({
    queryKey: ['shop-products'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select(`
          *,
          images:product_images(id, url, alt_text, sort_order, is_main),
          category:categories(id, name, slug, emoji, sort_order, is_active)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      return (data ?? []) as unknown as Product[];
    },
  });

  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]
    );
  };

  const filtered = useMemo(() => {
    let items = [...(products ?? [])];

    if (selectedCategories.length > 0) {
      items = items.filter((p) => p.category && selectedCategories.includes(p.category.slug));
    }
    items = items.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (onSaleOnly) items = items.filter((p) => p.is_on_sale);

    switch (sortBy) {
      case 'price-asc':  items.sort((a, b) => a.price - b.price); break;
      case 'price-desc': items.sort((a, b) => b.price - a.price); break;
      case 'newest':     items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
      case 'featured':   items.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)); break;
    }
    return items;
  }, [products, selectedCategories, priceRange, sortBy, onSaleOnly]);

  const clearFilters = () => {
    setSelectedCategories([]);
    setOnSaleOnly(false);
    setPriceRange([0, 5000]);
  };

  const hasActiveFilters = selectedCategories.length > 0 || onSaleOnly || priceRange[0] > 0 || priceRange[1] < 5000;

  const FiltersContent = () => (
    <div className="space-y-6">
      <div>
        <h4 className="mb-3 font-body text-sm font-semibold uppercase tracking-wider">Categories</h4>
        <div className="space-y-2">
          {(categories ?? []).map((cat) => (
            <label key={cat.slug} className="flex cursor-pointer items-center gap-2 font-body text-sm">
              <Checkbox
                checked={selectedCategories.includes(cat.slug)}
                onCheckedChange={() => toggleCategory(cat.slug)}
              />
              {cat.emoji} {cat.name}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-3 font-body text-sm font-semibold uppercase tracking-wider">Price Range</h4>
        <Slider
          value={priceRange}
          onValueChange={(v) => setPriceRange(v as [number, number])}
          max={5000}
          step={100}
          className="mt-2"
        />
        <div className="mt-2 flex justify-between font-body text-xs text-muted-foreground">
          <span>Rs. {priceRange[0].toLocaleString()}</span>
          <span>Rs. {priceRange[1].toLocaleString()}</span>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2 font-body text-sm">
        <Checkbox checked={onSaleOnly} onCheckedChange={(c) => setOnSaleOnly(!!c)} />
        On Sale Only
      </label>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="font-body text-xs">
          <X className="mr-1 h-3 w-3" /> Clear Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="pt-20">
      <div className="bg-cream-dark py-12">
        <div className="container">
          <h1 className="font-display text-3xl font-bold md:text-4xl">Shop All</h1>
          <p className="mt-2 font-body text-muted-foreground">Discover our complete collection</p>
        </div>
      </div>

      <div className="container py-10">
        <div className="mb-6 flex items-center justify-between">
          {/* Mobile filter trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="font-body md:hidden">
                <SlidersHorizontal className="mr-2 h-4 w-4" /> Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader><SheetTitle className="font-display">Filters</SheetTitle></SheetHeader>
              <div className="mt-6"><FiltersContent /></div>
            </SheetContent>
          </Sheet>

          <p className="font-body text-sm text-muted-foreground">
            {isLoading ? 'Loading...' : `${filtered.length} product${filtered.length !== 1 ? 's' : ''}`}
          </p>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-44 font-body text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="price-asc">Price: Low → High</SelectItem>
              <SelectItem value="price-desc">Price: High → Low</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-10">
          {/* Desktop sidebar */}
          <aside className="hidden w-56 shrink-0 md:block">
            <FiltersContent />
          </aside>

          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-square rounded-2xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center font-body text-muted-foreground">
                No products found. Try adjusting your filters.
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-6"
              >
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
