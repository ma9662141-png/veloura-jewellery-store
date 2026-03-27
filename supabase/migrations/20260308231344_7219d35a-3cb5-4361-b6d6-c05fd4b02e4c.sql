-- Fix order_items INSERT policy to allow guest orders (user_id IS NULL)
DROP POLICY IF EXISTS "User inserts items into own order" ON public.order_items;

CREATE POLICY "User inserts items into own order"
ON public.order_items
FOR INSERT
TO authenticated, anon
WITH CHECK (
  order_id IN (
    SELECT orders.id FROM orders
    WHERE (orders.user_id = auth.uid())
       OR (auth.uid() IS NULL AND orders.user_id IS NULL)
  )
);