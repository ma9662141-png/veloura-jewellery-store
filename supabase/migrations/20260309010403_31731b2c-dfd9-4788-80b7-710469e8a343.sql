-- 1. Remove the overly permissive SELECT policy on discount_codes
-- The validate_discount() SECURITY DEFINER function handles code validation
-- Admins still have full access via the "Admin manages discount codes" ALL policy
DROP POLICY IF EXISTS "Authenticated users verify active codes" ON public.discount_codes;

-- 2. Restrict analytics views to admin-only by revoking from anon
REVOKE SELECT ON public.v_daily_revenue FROM anon;
REVOKE SELECT ON public.v_dashboard_summary FROM anon;
REVOKE SELECT ON public.v_low_stock_products FROM anon;
REVOKE SELECT ON public.v_revenue_by_category FROM anon;
REVOKE SELECT ON public.v_revenue_by_city FROM anon;
REVOKE SELECT ON public.v_revenue_by_payment FROM anon;
REVOKE SELECT ON public.v_top_products FROM anon;