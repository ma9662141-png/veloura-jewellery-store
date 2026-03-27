-- Allow anon role to insert orders for guest checkout
DROP POLICY IF EXISTS "Authenticated users create own orders" ON public.orders;

CREATE POLICY "Users create own orders"
ON public.orders
FOR INSERT
TO authenticated, anon
WITH CHECK (
  ((auth.uid() IS NOT NULL) AND (user_id = auth.uid()))
  OR
  ((auth.uid() IS NULL) AND (user_id IS NULL))
);