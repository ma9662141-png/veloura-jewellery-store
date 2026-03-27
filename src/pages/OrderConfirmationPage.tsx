import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Package, MapPin, CreditCard, ArrowRight, ShoppingBag, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface OrderData {
  order_number: string;
  status: string;
  payment_method: string;
  delivery_name: string;
  delivery_phone: string;
  delivery_address: string;
  delivery_city: string;
  delivery_postal: string | null;
  subtotal: number;
  delivery_fee: number;
  discount_amount: number;
  total: number;
  created_at: string;
  order_items: {
    id: string;
    product_name: string;
    variant_name: string | null;
    quantity: number;
    unit_price: number;
    line_total: number;
    image_url: string | null;
  }[];
}

const PAYMENT_LABELS: Record<string, string> = {
  cod: '💵 Cash on Delivery',
  jazzcash: '📱 JazzCash',
  easypaisa: '📱 EasyPaisa',
  whatsapp: '💬 WhatsApp Order',
};

export default function OrderConfirmationPage() {
  const [params] = useSearchParams();
  const orderNumber = params.get('order');
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!orderNumber) { setLoading(false); return; }

    supabase
      .from('orders')
      .select('order_number, status, payment_method, delivery_name, delivery_phone, delivery_address, delivery_city, delivery_postal, subtotal, delivery_fee, discount_amount, total, created_at, order_items(id, product_name, variant_name, quantity, unit_price, line_total, image_url)')
      .eq('order_number', orderNumber)
      .single()
      .then(({ data }) => {
        setOrder(data as OrderData | null);
        setLoading(false);
      });
  }, [orderNumber]);

  const handleCopy = () => {
    if (!order) return;
    navigator.clipboard.writeText(order.order_number);
    setCopied(true);
    toast.success('Order number copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!orderNumber) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center pt-20 font-body">
        <ShoppingBag className="mb-4 h-16 w-16 text-muted-foreground/30" />
        <h1 className="font-display text-2xl font-bold">No order found</h1>
        <Button asChild className="mt-6 rounded-full px-8">
          <Link to="/shop">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pt-20">
        <div className="container max-w-2xl py-16 font-body">
          <div className="space-y-6 text-center">
            <Skeleton className="mx-auto h-16 w-16 rounded-full" />
            <Skeleton className="mx-auto h-8 w-64" />
            <Skeleton className="mx-auto h-5 w-48" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center pt-20 font-body">
        <ShoppingBag className="mb-4 h-16 w-16 text-muted-foreground/30" />
        <h1 className="font-display text-2xl font-bold">Order not found</h1>
        <p className="mt-2 text-muted-foreground">We couldn't find order {orderNumber}</p>
        <Button asChild className="mt-6 rounded-full px-8">
          <Link to="/shop">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="pt-20">
      <div className="container max-w-2xl py-10 font-body">
        {/* Success Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold">Order Confirmed!</h1>
          <p className="mt-2 text-muted-foreground">
            Thank you for your order. We'll get it to you soon! ✨
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-card px-5 py-2.5 shadow-sm">
            <span className="text-sm text-muted-foreground">Order #</span>
            <span className="text-lg font-semibold text-primary">{order.order_number}</span>
            <button onClick={handleCopy} className="rounded-md p-1 text-muted-foreground transition-colors hover:text-primary">
              {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Order Details */}
        <div className="space-y-5">
          {/* Items */}
          <div className="rounded-xl bg-card p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Package className="h-4 w-4" /> Items Ordered
            </h3>
            <div className="space-y-3">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  {item.image_url && (
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                      <img src={item.image_url} alt={item.product_name} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.product_name}</p>
                    {item.variant_name && <p className="text-xs text-muted-foreground">{item.variant_name}</p>}
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity} × Rs. {item.unit_price.toLocaleString()}</p>
                  </div>
                  <p className="text-sm font-semibold">Rs. {item.line_total.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery & Payment */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-xl bg-card p-6 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <MapPin className="h-4 w-4" /> Delivery
              </h3>
              <p className="text-sm font-medium">{order.delivery_name}</p>
              <p className="text-sm text-muted-foreground">{order.delivery_address}</p>
              <p className="text-sm text-muted-foreground">{order.delivery_city}{order.delivery_postal ? ` — ${order.delivery_postal}` : ''}</p>
              <p className="mt-1 text-sm text-muted-foreground">{order.delivery_phone}</p>
            </div>

            <div className="rounded-xl bg-card p-6 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <CreditCard className="h-4 w-4" /> Payment
              </h3>
              <p className="text-sm font-medium">{PAYMENT_LABELS[order.payment_method] || order.payment_method}</p>
              <div className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>Rs. {order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>{order.delivery_fee === 0 ? <span className="text-primary">Free</span> : `Rs. ${order.delivery_fee}`}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>Discount</span>
                    <span>-Rs. {order.discount_amount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 font-semibold">
                  <span>Total</span>
                  <span className="text-primary">Rs. {order.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button asChild className="rounded-full px-8">
            <Link to="/shop">Continue Shopping <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full px-8">
            <Link to="/account/orders">View My Orders</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
