import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown, ChevronUp, Package } from 'lucide-react';

const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Pending',    color: 'bg-amber-100 text-amber-700 border-amber-200' },
  confirmed:  { label: 'Confirmed',  color: 'bg-blue-100 text-blue-700 border-blue-200' },
  processing: { label: 'Processing', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  shipped:    { label: 'Shipped',    color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  delivered:  { label: 'Delivered',  color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  cancelled:  { label: 'Cancelled',  color: 'bg-red-100 text-red-700 border-red-200' },
  refunded:   { label: 'Refunded',   color: 'bg-gray-100 text-gray-700 border-gray-200' },
};

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

interface OrderItem {
  id: string;
  product_name: string;
  variant_name: string | null;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
}

interface StatusHistory {
  id: string;
  from_status: string | null;
  to_status: string;
  created_at: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  delivery_fee: number;
  discount_amount: number;
  total: number;
  payment_method: string;
  delivery_city: string;
  delivery_address: string;
  tracking_number: string | null;
  created_at: string;
  order_items: OrderItem[];
  order_status_history: StatusHistory[];
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('orders')
      .select(`
        id, order_number, status, subtotal, delivery_fee, discount_amount, total,
        payment_method, delivery_city, delivery_address, tracking_number, created_at,
        order_items(id, product_name, variant_name, image_url, unit_price, quantity, line_total),
        order_status_history(id, from_status, to_status, created_at)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders((data as any) || []);
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold md:text-3xl">My Orders</h1>

      {orders.length === 0 ? (
        <div className="rounded-xl bg-card p-12 text-center shadow-sm">
          <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="font-body text-muted-foreground">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isExpanded = expandedId === order.id;
            const cfg = ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG.pending;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="overflow-hidden rounded-xl bg-card shadow-sm"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-center gap-4">
                    <div className="hidden h-12 w-12 items-center justify-center rounded-lg bg-muted md:flex">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <span className="font-body text-sm font-semibold">#{order.order_number}</span>
                      <p className="font-body text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}{order.order_items.length} item{order.order_items.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`font-body text-xs ${cfg.color}`}>
                      {cfg.label}
                    </Badge>
                    <span className="font-body text-sm font-semibold text-primary">
                      Rs. {order.total.toLocaleString()}
                    </span>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border p-5 space-y-5">
                        {/* Progress bar */}
                        {order.status !== 'cancelled' && order.status !== 'refunded' && (
                          <div className="flex items-center gap-1">
                            {STATUS_STEPS.map((step, i) => {
                              const current = STATUS_STEPS.indexOf(order.status);
                              const done = i <= current;
                              return (
                                <div key={step} className="flex flex-1 items-center gap-1">
                                  <div className={`h-2 w-full rounded-full ${done ? 'bg-primary' : 'bg-muted'}`} />
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Status history */}
                        {order.order_status_history.length > 0 && (
                          <div className="space-y-1">
                            <p className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status History</p>
                            {order.order_status_history
                              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                              .map(h => (
                                <div key={h.id} className="flex items-center gap-2 font-body text-xs text-muted-foreground">
                                  <span>{new Date(h.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}</span>
                                  <span>→</span>
                                  <span className="capitalize font-medium text-foreground">{h.to_status}</span>
                                </div>
                              ))}
                          </div>
                        )}

                        {/* Items */}
                        <div className="space-y-3">
                          {order.order_items.map(item => (
                            <div key={item.id} className="flex items-center gap-4">
                              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                                {item.image_url && <img src={item.image_url} alt={item.product_name} className="h-full w-full object-cover" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-body text-sm font-medium truncate">{item.product_name}</p>
                                {item.variant_name && <p className="font-body text-xs text-muted-foreground">{item.variant_name}</p>}
                                <p className="font-body text-xs text-muted-foreground">Qty: {item.quantity}</p>
                              </div>
                              <span className="font-body text-sm font-medium">Rs. {item.line_total.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>

                        {/* Summary */}
                        <div className="space-y-1 border-t border-border pt-3 font-body text-sm">
                          <div className="flex justify-between text-muted-foreground">
                            <span>Subtotal</span><span>Rs. {order.subtotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Delivery</span><span>{order.delivery_fee === 0 ? 'Free' : `Rs. ${order.delivery_fee}`}</span>
                          </div>
                          {order.discount_amount > 0 && (
                            <div className="flex justify-between text-emerald-600">
                              <span>Discount</span><span>-Rs. {order.discount_amount.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between pt-1 font-semibold text-foreground">
                            <span>Total</span><span className="text-primary">Rs. {order.total.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
