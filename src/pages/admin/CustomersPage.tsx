import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, MessageCircle, ShieldOff, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export default function CustomersPage() {
  const { user: adminUser } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [blockTarget, setBlockTarget] = useState<{ id: string; name: string; blocking: boolean } | null>(null);
  const queryClient = useQueryClient();

  const { data: customers, isLoading } = useQuery({
    queryKey: ['admin-customers', search],
    queryFn: async () => {
      let q = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (search) q = q.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
      const { data } = await q;
      return data ?? [];
    },
  });

  const selected = customers?.find((c) => c.id === selectedId);

  const { data: customerOrders } = useQuery({
    queryKey: ['admin-customer-orders', selectedId],
    queryFn: async () => {
      if (!selectedId) return [];
      const { data } = await supabase
        .from('orders')
        .select('id, order_number, total, status, created_at')
        .eq('user_id', selectedId)
        .order('created_at', { ascending: false })
        .limit(5);
      return data ?? [];
    },
    enabled: !!selectedId,
  });

  const blockMutation = useMutation({
    mutationFn: async ({ id, block, name }: { id: string; block: boolean; name: string }) => {
      const { error } = await supabase.from('profiles').update({ is_active: !block }).eq('id', id);
      if (error) throw error;
      // Audit log
      await supabase.from('admin_audit_log').insert({
        admin_id: adminUser?.id,
        action: block ? 'blocked_user' : 'unblocked_user',
        entity_type: 'profile',
        entity_id: id,
        new_data: { is_active: !block, name },
      });
    },
    onSuccess: (_, { block }) => {
      toast.success(block ? 'Customer blocked' : 'Customer unblocked');
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      setBlockTarget(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const initials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Customers</h2>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or phone..." className="pl-9 bg-card border-border text-foreground" />
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : customers?.length === 0 ? (
        <p className="text-center py-16 text-muted-foreground">No customers found</p>
      ) : (
        <motion.div className="space-y-1" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.03 } } }}>
          {customers?.map((c) => (
            <motion.div
              key={c.id}
              variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
              onClick={() => setSelectedId(c.id)}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 cursor-pointer hover:bg-secondary transition-colors"
            >
              <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                {initials(c.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{c.full_name ?? 'Unknown'}</p>
                  {!c.is_active && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold uppercase">Blocked</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{c.phone ?? 'No phone'} · {c.city ?? 'N/A'}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-foreground">{c.total_orders} orders</p>
                <p className="text-xs text-muted-foreground">Rs. {c.total_spent?.toLocaleString()}</p>
              </div>
              {/* Block/Unblock button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setBlockTarget({ id: c.id, name: c.full_name ?? 'Unknown', blocking: c.is_active });
                }}
                className={`shrink-0 p-1.5 rounded-md text-xs transition-colors ${
                  c.is_active
                    ? 'text-red-400 hover:bg-red-500/10'
                    : 'text-green-400 hover:bg-green-500/10'
                }`}
                title={c.is_active ? 'Block' : 'Unblock'}
              >
                {c.is_active ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
              </button>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Block Confirmation Modal */}
      <Dialog open={!!blockTarget} onOpenChange={(open) => !open && setBlockTarget(null)}>
        <DialogContent className="admin-theme bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground font-body flex items-center gap-2">
              {blockTarget?.blocking ? '⛔ Block Customer' : '✅ Unblock Customer'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-foreground">
              Are you sure you want to {blockTarget?.blocking ? 'block' : 'unblock'}{' '}
              <strong>{blockTarget?.name}</strong>?
            </p>
            {blockTarget?.blocking && (
              <p className="text-xs text-muted-foreground mt-2">
                They will immediately lose access to their account and cannot place new orders.
              </p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBlockTarget(null)} className="border-border text-foreground">
              Cancel
            </Button>
            <Button
              onClick={() => blockTarget && blockMutation.mutate({ id: blockTarget.id, block: blockTarget.blocking, name: blockTarget.name })}
              className={blockTarget?.blocking ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : 'bg-green-600 text-white hover:bg-green-700'}
              disabled={blockMutation.isPending}
            >
              {blockTarget?.blocking ? 'Yes, Block' : 'Yes, Unblock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Detail Sheet */}
      <Sheet open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="admin-theme bg-card border-border w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-foreground font-body">{selected?.full_name ?? 'Customer'}</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
                  {initials(selected.full_name)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-foreground font-medium">{selected.full_name}</p>
                    {!selected.is_active && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold uppercase">Blocked</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{selected.phone ?? 'No phone'}</p>
                  <p className="text-xs text-muted-foreground">{selected.city ?? 'N/A'} · Joined {format(new Date(selected.created_at), 'MMM yyyy')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{selected.total_orders}</p>
                  <p className="text-xs text-muted-foreground">Orders</p>
                </div>
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="text-2xl font-bold text-primary">Rs. {selected.total_spent?.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Spent</p>
                </div>
              </div>

              {/* Block/Unblock in detail */}
              <Button
                variant="outline"
                className={`w-full ${selected.is_active ? 'border-destructive text-destructive hover:bg-destructive/10' : 'border-green-500 text-green-500 hover:bg-green-500/10'}`}
                onClick={() => setBlockTarget({ id: selected.id, name: selected.full_name ?? 'Unknown', blocking: selected.is_active })}
              >
                {selected.is_active ? (
                  <><ShieldOff className="h-4 w-4 mr-2" /> Block Customer</>
                ) : (
                  <><ShieldCheck className="h-4 w-4 mr-2" /> Unblock Customer</>
                )}
              </Button>

              {selected.phone && (
                <a
                  href={`https://wa.me/${selected.phone?.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-[#25D366] text-white font-medium text-sm"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp Customer
                </a>
              )}

              <div>
                <h4 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Recent Orders</h4>
                {customerOrders?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No orders yet</p>
                ) : (
                  <div className="space-y-2">
                    {customerOrders?.map((o) => (
                      <div key={o.id} className="flex items-center justify-between rounded-md border border-border p-2 text-sm">
                        <div>
                          <span className="text-foreground font-medium">{o.order_number}</span>
                          <p className="text-xs text-muted-foreground">{format(new Date(o.created_at), 'dd MMM yyyy')}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-foreground">Rs. {o.total?.toLocaleString()}</span>
                          <p className="text-xs capitalize text-muted-foreground">{o.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
