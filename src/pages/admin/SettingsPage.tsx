import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Wrench, Upload, ImageIcon } from 'lucide-react';
import { useRef } from 'react';

export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<any>(null);
  const [heroUploading, setHeroUploading] = useState(false);
  const heroFileRef = useRef<HTMLInputElement>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('store_settings').select('*').eq('id', 1).single();
      return data;
    },
  });

  useEffect(() => {
    if (settings) setForm({ ...settings });
  }, [settings]);

  const save = useMutation({
    mutationFn: async () => {
      if (!form) return;
      const { id, ...rest } = form;
      const { error } = await supabase.from('store_settings').update(rest).eq('id', 1);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Settings saved');
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      queryClient.invalidateQueries({ queryKey: ['store-settings-maintenance'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleHeroUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }
    setHeroUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `hero/hero-main.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('product-images')
        .upload(path, file, { cacheControl: '3600', upsert: true });
      if (uploadErr) throw uploadErr;
      const newUrl = `https://ftgaoadnxrodfgtsftoq.supabase.co/storage/v1/object/public/product-images/${path}?t=${Date.now()}`;
      const { error } = await supabase.from('store_settings').update({ hero_image_url: newUrl }).eq('id', 1);
      if (error) throw error;
      u('hero_image_url', newUrl);
      toast.success('Hero image updated ✓');
      queryClient.invalidateQueries({ queryKey: ['hero-image'] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setHeroUploading(false);
    }
  };

  if (isLoading || !form) return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>;

  const u = (key: string, val: any) => setForm((f: any) => ({ ...f, [key]: val }));

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Settings</h2>

      <Tabs defaultValue="store">
        <TabsList className="bg-accent border border-border w-full grid grid-cols-3 md:grid-cols-7">
          <TabsTrigger value="store" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Store</TabsTrigger>
          <TabsTrigger value="delivery" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Delivery</TabsTrigger>
          <TabsTrigger value="payments" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Payments</TabsTrigger>
          <TabsTrigger value="announcement" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Announce</TabsTrigger>
          <TabsTrigger value="hero" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Hero Img</TabsTrigger>
          <TabsTrigger value="maintenance" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Maint.</TabsTrigger>
          <TabsTrigger value="admin" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Admin</TabsTrigger>
        </TabsList>

        <TabsContent value="store" className="space-y-3 mt-4">
          <div><Label className="text-foreground text-xs">Store Name</Label><Input value={form.store_name} onChange={(e) => u('store_name', e.target.value)} className="bg-card border-border text-foreground mt-1" /></div>
          <div><Label className="text-foreground text-xs">Tagline</Label><Input value={form.store_tagline ?? ''} onChange={(e) => u('store_tagline', e.target.value)} className="bg-card border-border text-foreground mt-1" /></div>
          <div><Label className="text-foreground text-xs">Contact Email</Label><Input value={form.store_email ?? ''} onChange={(e) => u('store_email', e.target.value)} className="bg-card border-border text-foreground mt-1" /></div>
          <div><Label className="text-foreground text-xs">WhatsApp Number</Label><Input value={form.whatsapp_number ?? ''} onChange={(e) => u('whatsapp_number', e.target.value)} className="bg-card border-border text-foreground mt-1" /></div>
          <div><Label className="text-foreground text-xs">Instagram Handle</Label><Input value={form.instagram_handle ?? ''} onChange={(e) => u('instagram_handle', e.target.value)} className="bg-card border-border text-foreground mt-1" /></div>
          <Button onClick={() => save.mutate()} className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={save.isPending}>Save Changes</Button>
        </TabsContent>

        <TabsContent value="delivery" className="space-y-3 mt-4">
          <div><Label className="text-foreground text-xs">Free Delivery Above (Rs.)</Label><Input type="number" value={form.free_delivery_above} onChange={(e) => u('free_delivery_above', +e.target.value)} className="bg-card border-border text-foreground mt-1" /></div>
          <div><Label className="text-foreground text-xs">Standard Delivery Fee (Rs.)</Label><Input type="number" value={form.standard_delivery_fee} onChange={(e) => u('standard_delivery_fee', +e.target.value)} className="bg-card border-border text-foreground mt-1" /></div>
          <div><Label className="text-foreground text-xs">Estimated Delivery Time</Label><Input value={form.estimated_delivery ?? ''} onChange={(e) => u('estimated_delivery', e.target.value)} className="bg-card border-border text-foreground mt-1" /></div>
          <Button onClick={() => save.mutate()} className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={save.isPending}>Save Changes</Button>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground font-medium">💵 Cash on Delivery</span>
                <Switch checked={form.cod_enabled} onCheckedChange={(v) => u('cod_enabled', v)} />
              </div>
            </div>
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground font-medium">📱 JazzCash</span>
                <Switch checked={form.jazzcash_enabled} onCheckedChange={(v) => u('jazzcash_enabled', v)} />
              </div>
              {form.jazzcash_enabled && (
                <Input value={form.jazzcash_number ?? ''} onChange={(e) => u('jazzcash_number', e.target.value)} placeholder="JazzCash number" className="bg-background border-border text-foreground" />
              )}
            </div>
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground font-medium">🟣 EasyPaisa</span>
                <Switch checked={form.easypaisa_enabled} onCheckedChange={(v) => u('easypaisa_enabled', v)} />
              </div>
              {form.easypaisa_enabled && (
                <Input value={form.easypaisa_number ?? ''} onChange={(e) => u('easypaisa_number', e.target.value)} placeholder="EasyPaisa number" className="bg-background border-border text-foreground" />
              )}
            </div>
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground font-medium">💳 Card (Stripe)</span>
                <Switch checked={form.card_enabled} onCheckedChange={(v) => u('card_enabled', v)} />
              </div>
              {form.card_enabled && (
                <Input value={form.stripe_public_key ?? ''} onChange={(e) => u('stripe_public_key', e.target.value)} placeholder="Stripe Public Key" className="bg-background border-border text-foreground" />
              )}
            </div>
          </div>
          <Button onClick={() => save.mutate()} className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4" disabled={save.isPending}>Save Changes</Button>
        </TabsContent>

        <TabsContent value="announcement" className="space-y-3 mt-4">
          <div><Label className="text-foreground text-xs">Announcement Text</Label><Textarea value={form.announcement_text ?? ''} onChange={(e) => u('announcement_text', e.target.value)} className="bg-card border-border text-foreground mt-1" /></div>
          <div className="flex items-center gap-3">
            <Switch checked={form.announcement_active} onCheckedChange={(v) => u('announcement_active', v)} />
            <Label className="text-foreground text-xs">Active (shown on storefront)</Label>
          </div>
          {form.announcement_active && form.announcement_text && (
            <div className="rounded-md bg-primary text-primary-foreground text-center text-xs py-2 px-4">
              {form.announcement_text}
            </div>
          )}
          <Button onClick={() => save.mutate()} className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={save.isPending}>Save Changes</Button>
        </TabsContent>

        <TabsContent value="hero" className="space-y-4 mt-4">
          <div className="rounded-lg border border-border bg-card p-4 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-foreground">Homepage Hero Image</h3>
              <p className="text-xs text-muted-foreground mt-0.5">This image appears in the large hero section on the homepage</p>
            </div>
            {form.hero_image_url ? (
              <img
                src={form.hero_image_url}
                alt="Current hero"
                className="w-full max-h-48 object-cover rounded-lg border border-border"
              />
            ) : (
              <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border bg-accent">
                <div className="text-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">No hero image set — using default</p>
                </div>
              </div>
            )}
            <input
              ref={heroFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleHeroUpload(file);
                e.target.value = '';
              }}
            />
            <Button
              onClick={() => heroFileRef.current?.click()}
              disabled={heroUploading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Upload className="h-4 w-4 mr-2" />
              {heroUploading ? 'Uploading...' : 'Upload New Hero Image'}
            </Button>
            <p className="text-xs text-muted-foreground">Recommended: 1200×1500px, max 5MB. JPG or PNG.</p>
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-3 mt-4">
          <div className="rounded-lg border border-border p-4 space-y-4">
            <div className="flex items-center gap-3">
              <Wrench className="h-5 w-5 text-primary" />
              <div>
                <h3 className="text-sm font-medium text-foreground">Maintenance Mode</h3>
                <p className="text-xs text-muted-foreground">When ON: customers see a "Store temporarily closed" page. Admins can still access.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.maintenance_mode ?? false} onCheckedChange={(v) => u('maintenance_mode', v)} />
              <Label className="text-foreground text-xs">{form.maintenance_mode ? 'Maintenance ON' : 'Maintenance OFF'}</Label>
            </div>
            <div>
              <Label className="text-foreground text-xs">Message shown to visitors</Label>
              <Textarea
                value={form.maintenance_message ?? ''}
                onChange={(e) => u('maintenance_message', e.target.value)}
                className="bg-background border-border text-foreground mt-1"
                placeholder="We are updating our store..."
              />
            </div>
            {form.maintenance_mode && (
              <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-400">
                ⚠️ Maintenance mode is <strong>ON</strong>. Customers cannot access the store.
              </div>
            )}
          </div>
          <Button onClick={() => save.mutate()} className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={save.isPending}>Save Changes</Button>
        </TabsContent>

        <TabsContent value="admin" className="space-y-3 mt-4">
          <div className="rounded-lg border border-border p-4 space-y-2">
            <p className="text-sm text-foreground font-medium">{user?.email}</p>
            <p className="text-xs text-muted-foreground">Admin account</p>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.notify_new_order} onCheckedChange={(v) => u('notify_new_order', v)} />
            <Label className="text-foreground text-xs">Notify on new orders</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.notify_low_stock} onCheckedChange={(v) => u('notify_low_stock', v)} />
            <Label className="text-foreground text-xs">Notify on low stock</Label>
          </div>
          <Button onClick={() => save.mutate()} className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={save.isPending}>Save Changes</Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
