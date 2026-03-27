
-- 1. Featured products flag
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

-- 2. Flagged reviews
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN NOT NULL DEFAULT false;

-- 3. Maintenance mode
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS maintenance_message TEXT DEFAULT 'We are updating our store. We''ll be back shortly! ✨';

-- 4. Index for featured products
CREATE INDEX IF NOT EXISTS idx_products_featured 
ON public.products(is_featured) WHERE is_featured = true;
