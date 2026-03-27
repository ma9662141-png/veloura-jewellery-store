import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { MapPin, Plus, Pencil, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';

const PAKISTANI_CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
  'Peshawar', 'Quetta', 'Multan', 'Sialkot', 'Hyderabad',
  'Gujranwala', 'Bahawalpur', 'Sargodha', 'Abbottabad', 'Mardan',
];

interface Address {
  id: string;
  label: string | null;
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  postal_code: string | null;
  is_default: boolean;
}

const emptyForm = {
  label: 'Home', full_name: '', phone: '', address_line: '', city: '', postal_code: '', is_default: false,
};

export default function AddressesPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchAddresses = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false });
    setAddresses(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAddresses(); }, [user]);

  const openNew = () => {
    if (addresses.length >= 5) { toast.error('Maximum 5 addresses allowed'); return; }
    setEditId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (addr: Address) => {
    setEditId(addr.id);
    setForm({
      label: addr.label || 'Home',
      full_name: addr.full_name,
      phone: addr.phone,
      address_line: addr.address_line,
      city: addr.city,
      postal_code: addr.postal_code || '',
      is_default: addr.is_default,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    // If setting as default, unset others first
    if (form.is_default) {
      await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
    }

    const payload = {
      label: form.label,
      full_name: form.full_name,
      phone: form.phone,
      address_line: form.address_line,
      city: form.city,
      postal_code: form.postal_code || null,
      is_default: form.is_default,
      user_id: user.id,
    };

    if (editId) {
      const { error } = await supabase.from('addresses').update(payload).eq('id', editId);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success('Address updated');
    } else {
      const { error } = await supabase.from('addresses').insert(payload);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success('Address added');
    }

    setSaving(false);
    setDialogOpen(false);
    fetchAddresses();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('addresses').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Address removed');
    fetchAddresses();
  };

  const isValid = form.full_name && form.phone && form.address_line && form.city;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold md:text-3xl">Addresses</h1>
        <Button onClick={openNew} className="rounded-full font-body text-sm">
          <Plus className="mr-1.5 h-4 w-4" /> Add Address
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{editId ? 'Edit Address' : 'New Address'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-body text-sm">Label</Label>
                <Input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="Home / Office" className="font-body" />
              </div>
              <div className="space-y-2">
                <Label className="font-body text-sm">Full Name *</Label>
                <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="font-body" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-body text-sm">Phone *</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+923001234567" className="font-body" />
              </div>
              <div className="space-y-2">
                <Label className="font-body text-sm">City *</Label>
                <Select value={form.city} onValueChange={v => setForm(f => ({ ...f, city: v }))}>
                  <SelectTrigger className="font-body"><SelectValue placeholder="Select city" /></SelectTrigger>
                  <SelectContent>
                    {PAKISTANI_CITIES.map(c => <SelectItem key={c} value={c} className="font-body">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-body text-sm">Address Line *</Label>
              <Input value={form.address_line} onChange={e => setForm(f => ({ ...f, address_line: e.target.value }))} className="font-body" />
            </div>
            <div className="space-y-2">
              <Label className="font-body text-sm">Postal Code</Label>
              <Input value={form.postal_code} onChange={e => setForm(f => ({ ...f, postal_code: e.target.value }))} className="font-body" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label className="font-body text-sm">Set as default address</Label>
              <Switch checked={form.is_default} onCheckedChange={v => setForm(f => ({ ...f, is_default: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="font-body">Cancel</Button>
            <Button onClick={handleSave} disabled={!isValid || saving} className="rounded-full font-body">
              {saving ? 'Saving...' : editId ? 'Save Changes' : 'Add Address'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {addresses.length === 0 ? (
        <div className="rounded-xl bg-card p-12 text-center shadow-sm">
          <MapPin className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="font-body text-muted-foreground">No addresses saved yet</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {addresses.map(addr => (
              <motion.div
                key={addr.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`relative rounded-xl bg-card p-5 shadow-sm transition-all ${addr.is_default ? 'border-2 border-primary' : 'border border-border'}`}
              >
                {addr.is_default && (
                  <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-body text-[10px] font-semibold text-primary">
                    <Check className="h-3 w-3" /> Default
                  </span>
                )}
                <div className="mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-body text-sm font-semibold">{addr.label || 'Address'}</span>
                </div>
                <p className="font-body text-sm">{addr.full_name}</p>
                <p className="font-body text-sm text-muted-foreground">{addr.address_line}</p>
                <p className="font-body text-sm text-muted-foreground">{addr.city}{addr.postal_code ? `, ${addr.postal_code}` : ''}</p>
                <p className="font-body text-xs text-muted-foreground mt-1">{addr.phone}</p>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="rounded-full font-body text-xs" onClick={() => openEdit(addr)}>
                    <Pencil className="mr-1 h-3 w-3" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-full font-body text-xs text-destructive hover:bg-destructive/10" onClick={() => handleDelete(addr.id)}>
                    <Trash2 className="mr-1 h-3 w-3" /> Remove
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
