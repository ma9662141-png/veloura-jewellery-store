import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSearchParams } from 'react-router-dom';
import { Search, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import type { Tables } from '@/integrations/supabase/types';
import { useAuth } from '@/context/AuthContext';

const statuses = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
const statusColors: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  processing: '#8b5cf6',
  shipped: '#6366f1',
  delivered: '#22c55e',
  cancelled: '#ef4444',
  refunded: '#9ca3af',
};
const courierOptions = ['tcs', 'leopards', 'rider', 'postex', 'm_and_p', 'other'] as const;
const cancelReasons = [
  'Customer requested cancellation',
  'Item out of stock',
  'Payment not received',
  'Suspicious order',
  'Other',
];

export default function OrdersPage() {
  const { user: adminUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? 'all');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(searchParams.get('order'));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [cancelModal, setCancelModal] = useState<{ id: string; orderNumber: string } | null>(null);
  const [cancelReason, setCancelReason] = useState(cancelReasons[0]);
  const [cancelCustom, setCancelCustom] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const s = searchParams.get('status');
    if (s) setStatusFilter(s);
    const o = searchParams.get('order');
    if (o) setSelectedOrderId(o);
  }, [searchParams]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter, search],
    queryFn: async () => {
      let q = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (statusFilter !== 'all') q = q.eq('status', statusFilter as any);
      if (search) q = q.or(`order_number.ilike.%${search}%,delivery_name.ilike.%${search}%`);
      const { data } = await q;
      return data ?? [];
    },
  });

  const { data: orderDetail } = useQuery({
    queryKey: ['admin-order-detail', selectedOrderId],
    queryFn: async () => {
      if (!selectedOrderId) return null;
      const [orderRes, itemsRes] = await Promise.all([
        supabase.from('orders').select('*').eq('id', selectedOrderId).single(),
        supabase.from('order_items').select('*').eq('order_id', selectedOrderId),
      ]);
      return { order: orderRes.data, items: itemsRes.data ?? [] };
    },
    enabled: !!selectedOrderId,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const update: any = { status };
      if (status === 'shipped') update.shipped_at = new Date().toISOString();
      if (status === 'delivered') update.delivered_at = new Date().toISOString();
      if (status === 'cancelled' && reason) update.cancelled_reason = reason;
      const { error } = await supabase.from('orders').update(update).eq('id', id);
      if (error) throw error;
      await supabase.from('admin_audit_log').insert({
        admin_id: adminUser?.id,
        action: status === 'cancelled' ? 'cancelled_order' : 'updated_status',
        entity_type: 'order',
        entity_id: id,
        new_data: { status, reason },
      });
    },
    onSuccess: () => {
      toast.success('Order status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail'] });
      setCancelModal(null);
    },
  });

  const refundMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('orders').update({ payment_status: 'refunded' as any }).eq('id', id);
      if (error) throw error;
      await supabase.from('admin_audit_log').insert({
        admin_id: adminUser?.id,
        action: 'refunded_order',
        entity_type: 'order',
        entity_id: id,
      });
    },
    onSuccess: () => {
      toast.success('Order marked as refunded');
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail'] });
    },
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const ids = [...selectedIds];
      const updates: any = { status };
      if (status === 'shipped') updates.shipped_at = new Date().toISOString();
      if (status === 'delivered') updates.delivered_at = new Date().toISOString();
      const { error } = await supabase.from('orders').update(updates).in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Bulk update completed');
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
  });

  const updateShipping = useMutation({
    mutationFn: async ({ id, courier, tracking_number }: { id: string; courier: string; tracking_number: string }) => {
      const { error } = await supabase.from('orders').update({ courier: courier as any, tracking_number }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Shipping info saved');
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail'] });
    },
  });

  const updateNotes = useMutation({
    mutationFn: async ({ id, admin_notes }: { id: string; admin_notes: string }) => {
      const { error } = await supabase.from('orders').update({ admin_notes }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => toast.success('Notes saved'),
  });

  const od = orderDetail?.order;
  const [courier, setCourier] = useState('');
  const [tracking, setTracking] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (od) {
      setCourier(od.courier ?? '');
      setTracking(od.tracking_number ?? '');
      setNotes(od.admin_notes ?? '');
    }
  }, [od]);

  const getWhatsAppUrl = (order: Tables<'orders'>, status: string) => {
    const phone = order.delivery_phone?.replace(/[^0-9]/g, '');
    const name = order.delivery_name;
    const num = order.order_number;
    let msg = '';
    if (status === 'confirmed') msg = `Hi ${name}! 👋 Your Veloura Jewels order ${num} has been confirmed and will be dispatched within 24 hours. ✨`;
    else if (status === 'shipped') msg = `Hi ${name}! 🚚 Your order ${num} has been shipped via ${order.courier ?? 'courier'}. Tracking: ${order.tracking_number ?? 'N/A'}`;
    else if (status === 'delivered') msg = `Hi ${name}! 🎉 Your order ${num} has been delivered! We hope you love it. ✨`;
    else msg = `Hi ${name}! Regarding your order ${num}...`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  const nextStatus: Record<string, string> = {
    pending: 'confirmed',
    confirmed: 'processing',
    processing: 'shipped',
    shipped: 'delivered',
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Orders</h2>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order # or name..." className="pl-9 bg-card border-border text-foreground" />
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setSearchParams(s === 'all' ? {} : { status: s }); }}
            className={`px-3 py-1.5 text-xs rounded-md whitespace-nowrap capitalize transition-colors ${
              statusFilter === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-accent border border-border flex-wrap">
          <span className="text-xs text-foreground font-medium">☑ {selectedIds.size} selected</span>
          <Button size="sm" variant="outline" className="text-xs border-border text-foreground h-7" onClick={() => bulkStatusMutation.mutate('confirmed')}>Mark Confirmed</Button>
          <Button size="sm" variant="outline" className="text-xs border-border text-foreground h-7" onClick={() => bulkStatusMutation.mutate('shipped')}>Mark Shipped</Button>
          <Button size="sm" variant="outline" className="text-xs border-destructive text-destructive h-7" onClick={() => bulkStatusMutation.mutate('cancelled')}>Cancel Selected</Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : orders?.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground"><p>No orders found</p></div>
      ) : (
        <motion.div className="space-y-2" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.04 } } }}>
          {orders?.map((o) => (
            <motion.div
              key={o.id}
              variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
              className={`rounded-lg border border-border bg-card p-3 cursor-pointer hover:bg-secondary transition-colors ${
                o.status === 'pending' ? 'border-l-2 border-l-amber-500' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedIds.has(o.id)}
                  onCheckedChange={() => toggleSelect(o.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-1 min-w-0" onClick={() => setSelectedOrderId(o.id)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-foreground">{o.order_number}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {o.delivery_name} · {o.delivery_city}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      <div>
                        <span className="text-sm font-medium text-foreground">Rs. {o.total?.toLocaleString()}</span>
                        <p className="text-[10px] text-muted-foreground">{format(new Date(o.created_at), 'dd MMM')}</p>
                      </div>
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium capitalize"
                        style={{ backgroundColor: statusColors[o.status] + '20', color: statusColors[o.status] }}
                      >
                        {o.status}
                      </span>
                      {o.payment_status === 'refunded' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent text-muted-foreground">REFUNDED</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Order Detail Sheet */}
      <Sheet open={!!selectedOrderId} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
        <SheetContent className="admin-theme bg-card border-border w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-foreground font-body flex items-center gap-2 flex-wrap">
              {od?.order_number}
              {od && (
                <span className="px-2 py-0.5 rounded text-xs font-medium capitalize" style={{ backgroundColor: statusColors[od.status] + '20', color: statusColors[od.status] }}>
                  {od.status}
                </span>
              )}
              {od?.payment_status === 'refunded' && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-accent text-muted-foreground">REFUNDED</span>
              )}
            </SheetTitle>
          </SheetHeader>

          {od && (
            <div className="mt-4 space-y-5">
              {/* Customer */}
              <div className="rounded-lg border border-border p-3 space-y-1 text-sm">
                <h4 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Customer</h4>
                <p className="text-foreground font-medium">{od.delivery_name}</p>
                <p className="text-muted-foreground">{od.delivery_phone}</p>
                {od.delivery_email && <p className="text-muted-foreground">{od.delivery_email}</p>}
                <p className="text-muted-foreground">{od.delivery_address}, {od.delivery_city}</p>
                {od.delivery_notes && <p className="text-xs text-muted-foreground italic">Note: {od.delivery_notes}</p>}
              </div>

              {/* Items */}
              <div className="rounded-lg border border-border p-3">
                <h4 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Items</h4>
                <div className="space-y-2">
                  {orderDetail?.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 text-sm">
                      {item.image_url ? (
                        <img src={item.image_url} alt="" className="h-10 w-10 rounded object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-accent" />
                      )}
                      <div className="flex-1">
                        <p className="text-foreground">{item.product_name}</p>
                        {item.variant_name && <p className="text-xs text-muted-foreground">{item.variant_name}</p>}
                      </div>
                      <span className="text-muted-foreground">×{item.quantity}</span>
                      <span className="text-foreground font-medium">Rs. {item.line_total?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="rounded-lg border border-border p-3 text-sm space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span><span>Rs. {od.subtotal?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery</span><span>Rs. {od.delivery_fee?.toLocaleString()}</span>
                </div>
                {od.discount_amount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount</span><span>-Rs. {od.discount_amount?.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-foreground font-bold text-base pt-1 border-t border-border">
                  <span>Total</span><span className="text-primary">Rs. {od.total?.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment + Cancel Reason */}
              <div className="flex gap-2 text-xs flex-wrap">
                <span className="px-2 py-1 rounded bg-accent text-foreground capitalize">{od.payment_method}</span>
                <span className="px-2 py-1 rounded bg-accent text-foreground capitalize">{od.payment_status}</span>
                {od.payment_ref && <span className="px-2 py-1 rounded bg-accent text-muted-foreground">Ref: {od.payment_ref}</span>}
              </div>
              {od.cancelled_reason && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-2 text-xs text-destructive">
                  <strong>Cancel reason:</strong> {od.cancelled_reason}
                </div>
              )}

              {/* Status Update */}
              {nextStatus[od.status] && (
                <Button
                  onClick={() => updateStatus.mutate({ id: od.id, status: nextStatus[od.status] })}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={updateStatus.isPending}
                >
                  Mark as {nextStatus[od.status]}
                </Button>
              )}

              {/* Refund Button */}
              {(od.status === 'delivered' || od.status === 'cancelled') && od.payment_status !== 'refunded' && (
                <Button
                  variant="outline"
                  className="w-full border-amber-500 text-amber-500 hover:bg-amber-500/10"
                  onClick={() => refundMutation.mutate(od.id)}
                  disabled={refundMutation.isPending}
                >
                  Mark as Refunded
                </Button>
              )}

              {/* Shipping */}
              <div className="rounded-lg border border-border p-3 space-y-2">
                <h4 className="text-xs text-muted-foreground uppercase tracking-wider">Shipping</h4>
                <Select value={courier} onValueChange={setCourier}>
                  <SelectTrigger className="bg-background border-border text-foreground"><SelectValue placeholder="Select courier" /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {courierOptions.map((c) => (
                      <SelectItem key={c} value={c} className="capitalize">{c.replace('_', ' & ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Tracking number" className="bg-background border-border text-foreground" />
                <Button variant="outline" size="sm" onClick={() => updateShipping.mutate({ id: od.id, courier, tracking_number: tracking })} className="border-border text-foreground">
                  Save Shipping
                </Button>
              </div>

              {/* WhatsApp */}
              <a
                href={getWhatsAppUrl(od, od.status)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-[#25D366] text-white font-medium text-sm hover:bg-[#20bd5a] transition-colors"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp Customer
              </a>

              {/* Admin Notes */}
              <div className="space-y-2">
                <h4 className="text-xs text-muted-foreground uppercase tracking-wider">Admin Notes</h4>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-background border-border text-foreground min-h-[80px]" />
                <Button variant="outline" size="sm" onClick={() => updateNotes.mutate({ id: od.id, admin_notes: notes })} className="border-border text-foreground">
                  Save Notes
                </Button>
              </div>

              {/* Cancel with Reason */}
              {od.status !== 'cancelled' && od.status !== 'delivered' && (
                <Button
                  variant="outline"
                  className="w-full border-destructive text-destructive hover:bg-destructive/10"
                  onClick={() => setCancelModal({ id: od.id, orderNumber: od.order_number })}
                >
                  Cancel Order
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Cancel with Reason Modal */}
      <Dialog open={!!cancelModal} onOpenChange={(open) => !open && setCancelModal(null)}>
        <DialogContent className="admin-theme bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground font-body">Cancel {cancelModal?.orderNumber}?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={cancelReason} onValueChange={setCancelReason}>
              <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                {cancelReasons.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
            {cancelReason === 'Other' && (
              <Textarea value={cancelCustom} onChange={(e) => setCancelCustom(e.target.value)} placeholder="Enter reason..." className="bg-background border-border text-foreground" />
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelModal(null)} className="border-border text-foreground">Keep Order</Button>
            <Button
              className="bg-destructive text-destructive-foreground"
              onClick={() => cancelModal && updateStatus.mutate({
                id: cancelModal.id,
                status: 'cancelled',
                reason: cancelReason === 'Other' ? cancelCustom : cancelReason,
              })}
              disabled={updateStatus.isPending}
            >
              Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
