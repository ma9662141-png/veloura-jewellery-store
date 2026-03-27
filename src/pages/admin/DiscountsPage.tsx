import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Percent, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

const defaultForm = {
  code: '',
  type: 'percentage' as 'percentage' | 'flat',
  value: 0,
  min_order_value: 0,
  max_uses: null as number | null,
  valid_from: new Date().toISOString().split('T')[0],
  valid_until: '',
};

export default function DiscountsPage() {
  const { user: adminUser } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: codes, isLoading } = useQuery({
    queryKey: ['admin-discounts'],
    queryFn: async () => {
      const { data } = await supabase.from('discount_codes').select('*').order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        code: form.code.toUpperCase().trim(),
        type: form.type,
        value: form.value,
        min_order_value: form.min_order_value,
        max_uses: form.max_uses,
        valid_from: new Date(form.valid_from).toISOString(),
        valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
        is_active: true,
        created_by: adminUser?.id ?? null,
      };

      if (editingId) {
        const { error } = await supabase.from('discount_codes').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('discount_codes').insert(payload);
        if (error) throw error;
        await supabase.from('admin_audit_log').insert({
          admin_id: adminUser?.id,
          action: 'created_code',
          entity_type: 'discount_code',
          new_data: { code: payload.code },
        });
      }
    },
    onSuccess: () => {
      toast.success(editingId ? 'Discount updated' : 'Discount created');
      setFormOpen(false);
      setForm(defaultForm);
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-discounts'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('discount_codes').update({ is_active: active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Discount updated');
      queryClient.invalidateQueries({ queryKey: ['admin-discounts'] });
    },
  });

  const openEdit = (c: any) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      type: c.type,
      value: c.value,
      min_order_value: c.min_order_value ?? 0,
      max_uses: c.max_uses,
      valid_from: new Date(c.valid_from).toISOString().split('T')[0],
      valid_until: c.valid_until ? new Date(c.valid_until).toISOString().split('T')[0] : '',
    });
    setFormOpen(true);
  };

  const isExpired = (c: any) => c.valid_until && new Date(c.valid_until) < new Date();
  const isMaxed = (c: any) => c.max_uses && c.used_count >= c.max_uses;

  const getStatus = (c: any) => {
    if (!c.is_active) return { label: 'Inactive', color: 'text-muted-foreground bg-accent' };
    if (isExpired(c)) return { label: 'Expired', color: 'text-red-400 bg-red-500/20' };
    if (isMaxed(c)) return { label: 'Maxed', color: 'text-amber-400 bg-amber-500/20' };
    return { label: 'Active', color: 'text-green-400 bg-green-500/20' };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Discount Codes</h2>
        <Button onClick={() => { setEditingId(null); setForm(defaultForm); setFormOpen(true); }} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1" /> Create Code
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : codes?.length === 0 ? (
        <p className="text-center py-16 text-muted-foreground">No discount codes yet</p>
      ) : (
        <motion.div className="space-y-2" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.04 } } }}>
          {codes?.map((c) => {
            const status = getStatus(c);
            return (
              <motion.div
                key={c.id}
                variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
                className="rounded-lg border border-border bg-card p-3 hover:bg-secondary transition-colors cursor-pointer"
                onClick={() => openEdit(c)}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    {c.type === 'percentage' ? <Percent className="h-4 w-4 text-primary" /> : <DollarSign className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-bold text-foreground">{c.code}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${status.color}`}>{status.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {c.type === 'percentage' ? `${c.value}% off` : `Rs.${c.value} off`}
                      {c.min_order_value ? ` · Min Rs.${c.min_order_value}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-foreground">{c.used_count}{c.max_uses ? `/${c.max_uses}` : ''} uses</p>
                    <p className="text-[10px] text-muted-foreground">
                      {c.valid_until ? `Expires ${format(new Date(c.valid_until), 'MMM yyyy')}` : 'No expiry'}
                    </p>
                  </div>
                  <Switch
                    checked={c.is_active}
                    onCheckedChange={(v) => { toggleActive.mutate({ id: c.id, active: v }); }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) { setEditingId(null); setForm(defaultForm); } }}>
        <DialogContent className="admin-theme bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground font-body">{editingId ? 'Edit Discount' : 'Create Discount Code'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-foreground text-xs">Code</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="bg-background border-border text-foreground mt-1 font-mono uppercase" placeholder="VELOURA10" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-foreground text-xs">Type</Label>
                <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="bg-background border-border text-foreground mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="percentage">Percentage %</SelectItem>
                    <SelectItem value="flat">Flat Rs.</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-foreground text-xs">Value</Label>
                <Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: +e.target.value })} className="bg-background border-border text-foreground mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-foreground text-xs">Minimum Order Value (Rs.)</Label>
              <Input type="number" value={form.min_order_value} onChange={(e) => setForm({ ...form, min_order_value: +e.target.value })} className="bg-background border-border text-foreground mt-1" />
            </div>
            <div>
              <Label className="text-foreground text-xs">Maximum Uses (blank = unlimited)</Label>
              <Input type="number" value={form.max_uses ?? ''} onChange={(e) => setForm({ ...form, max_uses: e.target.value ? +e.target.value : null })} className="bg-background border-border text-foreground mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-foreground text-xs">Valid From</Label>
                <Input type="date" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} className="bg-background border-border text-foreground mt-1" />
              </div>
              <div>
                <Label className="text-foreground text-xs">Valid Until</Label>
                <Input type="date" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} className="bg-background border-border text-foreground mt-1" placeholder="No expiry" />
              </div>
            </div>
            <Button onClick={() => saveMutation.mutate()} className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={saveMutation.isPending || !form.code}>
              {editingId ? 'Update Code' : 'Create Code'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
