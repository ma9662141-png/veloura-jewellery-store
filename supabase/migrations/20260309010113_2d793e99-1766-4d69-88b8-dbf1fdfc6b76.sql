ALTER VIEW public.v_daily_revenue SET (security_invoker = true);
ALTER VIEW public.v_dashboard_summary SET (security_invoker = true);
ALTER VIEW public.v_low_stock_products SET (security_invoker = true);
ALTER VIEW public.v_revenue_by_category SET (security_invoker = true);
ALTER VIEW public.v_revenue_by_city SET (security_invoker = true);
ALTER VIEW public.v_revenue_by_payment SET (security_invoker = true);
ALTER VIEW public.v_top_products SET (security_invoker = true);