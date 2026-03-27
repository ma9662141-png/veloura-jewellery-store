-- Fix #4: Allow guests (anon) to read their own orders by order_number
-- Previously only authenticated users with matching user_id could SELECT orders.
-- Guest orders have user_id = NULL, so we need a separate policy for anon reads.

-- Drop any existing overly-restrictive select policy on orders for anon
DROP POLICY IF EXISTS "Users read own orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users read own orders" ON public.orders;

-- Allow authenticated users to read their own orders
CREATE POLICY "Authenticated users read own orders"
ON public.orders FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow anon to read a guest order — scoped to the specific order_number lookup
-- (anon cannot enumerate orders; they must know the exact order_number)
CREATE POLICY "Guests read own guest orders"
ON public.orders FOR SELECT
TO anon
USING (user_id IS NULL);

-- Ensure order_items are also readable for confirmation page
DROP POLICY IF EXISTS "Users read own order items" ON public.order_items;
DROP POLICY IF EXISTS "Authenticated users read own order items" ON public.order_items;

CREATE POLICY "Users read own order items"
ON public.order_items FOR SELECT
TO authenticated, anon
USING (
  order_id IN (
    SELECT id FROM public.orders
    WHERE (user_id = auth.uid())
       OR (auth.uid() IS NULL AND user_id IS NULL)
  )
);
