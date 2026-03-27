import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, Plus, Grid3X3, List, Edit2, Upload, X, Star, GripVertical, ImageIcon, Copy, MoreHorizontal, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

const SUPABASE_URL = "https://ftgaoadnxrodfgtsftoq.supabase.co";
const BUCKET = 'product-images';

interface ProductImage {
  id?: string;
  url: string;
  is_main: boolean;
  sort_order: number;
  file?: File;
}

const defaultProduct = {
  name: '', slug: '', description: '', material_care: '',
  shipping_info: '3–5 working days · Pakistan-wide delivery',
  price: 0, original_price: null as number | null, is_on_sale: false, discount_pct: null as number | null,
  stock_qty: 0, low_stock_alert: 10, sku: '', track_inventory: true,
  status: 'draft' as 'draft' | 'active' | 'archived', gender: 'unisex' as 'unisex' | 'female' | 'male',
  category_id: null as string | null, collection_id: null as string | null,
  tags: [] as string[],
};

export default function ProductsPage() {
  const { user: adminUser } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(defaultProduct);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products', search, statusFilter],
    queryFn: async () => {
      let q = supabase
        .from('products')
        .select('*, categories(name), product_images(id, url, is_main, sort_order)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (statusFilter !== 'all') q = q.eq('status', statusFilter as any);
      if (search) q = q.ilike('name', `%${search}%`);
      const { data } = await q;
      return data ?? [];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('id, name').order('sort_order');
      return data ?? [];
    },
  });

  const { data: collections } = useQuery({
    queryKey: ['admin-collections'],
    queryFn: async () => {
      const { data } = await supabase.from('collections').select('id, name').order('sort_order');
      return data ?? [];
    },
  });

  const uploadFile = async (file: File, productId: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
  };

  const saveMutation = useMutation({
    mutationFn: async ({ overrideStatus }: { overrideStatus?: 'draft' | 'active' | 'archived' } = {}) => {
      const finalStatus = overrideStatus ?? form.status;
      const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const payload = {
        name: form.name, slug,
        description: form.description || null,
        material_care: form.material_care || null,
        shipping_info: form.shipping_info || null,
        price: form.price, original_price: form.original_price,
        is_on_sale: form.is_on_sale, discount_pct: form.discount_pct,
        stock_qty: form.stock_qty, low_stock_alert: form.low_stock_alert,
        sku: form.sku || null, track_inventory: form.track_inventory,
        status: finalStatus, gender: form.gender,
        category_id: form.category_id, collection_id: form.collection_id,
        tags: form.tags.length > 0 ? form.tags : null,
      };

      let productId: string;
      if (editing) {
        const { error } = await supabase.from('products').update(payload).eq('id', editing.id);
        if (error) throw error;
        productId = editing.id;
      } else {
        const { data, error } = await supabase.from('products').insert(payload).select('id').single();
        if (error) throw error;
        productId = data.id;
      }

      setUploading(true);
      const uploadedImages: ProductImage[] = [];
      for (const img of images) {
        if (img.file) {
          const url = await uploadFile(img.file, productId);
          uploadedImages.push({ ...img, url, file: undefined });
        } else {
          uploadedImages.push(img);
        }
      }

      if (editing) {
        const existingIds = editing.product_images?.map((i: any) => i.id).filter(Boolean) ?? [];
        const keepIds = uploadedImages.map(i => i.id).filter(Boolean);
        const toDelete = existingIds.filter((id: string) => !keepIds.includes(id));
        if (toDelete.length > 0) {
          await supabase.from('product_images').delete().in('id', toDelete);
        }
      }

      for (let i = 0; i < uploadedImages.length; i++) {
        const img = uploadedImages[i];
        const row = { product_id: productId, url: img.url, is_main: img.is_main, sort_order: i, source: 'upload' as const };
        if (img.id) {
          await supabase.from('product_images').update(row).eq('id', img.id);
        } else {
          await supabase.from('product_images').insert(row);
        }
      }
      setUploading(false);
    },
    onSuccess: () => {
      toast.success(editing ? 'Product updated' : 'Product created');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setFormOpen(false); setEditing(null); setForm(defaultProduct); setImages([]);
    },
    onError: (e: any) => { setUploading(false); toast.error(e.message); },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (product: any) => {
      const { data: newProd, error } = await supabase.from('products').insert({
        name: product.name + ' (Copy)',
        slug: product.slug + '-copy-' + Date.now().toString(36),
        description: product.description,
        material_care: product.material_care,
        shipping_info: product.shipping_info,
        price: product.price,
        original_price: product.original_price,
        is_on_sale: product.is_on_sale,
        discount_pct: product.discount_pct,
        stock_qty: 0,
        low_stock_alert: product.low_stock_alert,
        sku: null,
        track_inventory: product.track_inventory,
        status: 'draft' as const,
        gender: product.gender,
        category_id: product.category_id,
        collection_id: product.collection_id,
        tags: product.tags,
      }).select('id').single();
      if (error) throw error;

      const imgs = product.product_images ?? [];
      for (const img of imgs) {
        await supabase.from('product_images').insert({
          product_id: newProd.id,
          url: img.url,
          is_main: img.is_main,
          sort_order: img.sort_order,
          source: 'upload' as const,
        });
      }

      await supabase.from('admin_audit_log').insert({
        admin_id: adminUser?.id,
        action: 'duplicated_product',
        entity_type: 'product',
        entity_id: newProd.id,
        new_data: { name: product.name + ' (Copy)' },
      });

      return newProd;
    },
    onSuccess: () => {
      toast.success('Product duplicated as draft ✓');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      await supabase.from('admin_audit_log').insert({
        admin_id: adminUser?.id,
        action: 'deleted_product',
        entity_type: 'product',
        entity_id: id,
        old_data: { name },
      });
    },
    onSuccess: () => {
      toast.success('Product deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setDeleteTarget(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleFeatured = useMutation({
    mutationFn: async ({ id, featured, name }: { id: string; featured: boolean; name: string }) => {
      const { error } = await supabase.from('products').update({ is_featured: featured } as any).eq('id', id);
      if (error) throw error;
      await supabase.from('admin_audit_log').insert({
        admin_id: adminUser?.id,
        action: 'toggled_featured',
        entity_type: 'product',
        entity_id: id,
        new_data: { is_featured: featured, name },
      });
    },
    onSuccess: () => {
      toast.success('Featured status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const ids = [...selectedIds];
      const { error } = await supabase.from('products').update({ status: status as any }).in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Bulk update completed');
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      name: p.name, slug: p.slug, description: p.description ?? '',
      material_care: p.material_care ?? '', shipping_info: p.shipping_info ?? '',
      price: p.price, original_price: p.original_price,
      is_on_sale: p.is_on_sale, discount_pct: p.discount_pct,
      stock_qty: p.stock_qty, low_stock_alert: p.low_stock_alert,
      sku: p.sku ?? '', track_inventory: p.track_inventory,
      status: p.status, gender: p.gender,
      category_id: p.category_id, collection_id: p.collection_id,
      tags: p.tags ?? [],
    });
    const existingImages: ProductImage[] = (p.product_images ?? [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((img: any) => ({ id: img.id, url: img.url, is_main: img.is_main, sort_order: img.sort_order }));
    setImages(existingImages);
    setFormOpen(true);
  };

  const openNew = () => { setEditing(null); setForm(defaultProduct); setImages([]); setFormOpen(true); };

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const remaining = 6 - images.length;
    if (remaining <= 0) { toast.error('Maximum 6 images allowed'); return; }
    const newImages: ProductImage[] = [];
    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} is too large (max 5MB)`); continue; }
      newImages.push({ url: URL.createObjectURL(file), is_main: images.length === 0 && newImages.length === 0, sort_order: images.length + newImages.length, file });
    }
    setImages(prev => [...prev, ...newImages]);
  }, [images.length]);

  const removeImage = (index: number) => {
    setImages(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (prev[index].is_main && updated.length > 0) updated[0] = { ...updated[0], is_main: true };
      return updated.map((img, i) => ({ ...img, sort_order: i }));
    });
  };

  const setMainImage = (index: number) => { setImages(prev => prev.map((img, i) => ({ ...img, is_main: i === index }))); };

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    setImages(prev => {
      const updated = [...prev]; const [moved] = updated.splice(from, 1); updated.splice(to, 0, moved);
      return updated.map((img, i) => ({ ...img, sort_order: i }));
    });
  };

  const getMainImage = (p: any) => { const imgs = p.product_images ?? []; const main = imgs.find((i: any) => i.is_main); return main?.url ?? imgs[0]?.url; };

  const stockBadge = (qty: number) => {
    if (qty === 0) return <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive font-medium">OUT OF STOCK</span>;
    if (qty <= 5) return <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive font-medium">🔴 {qty}</span>;
    if (qty <= 20) return <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">🟡 {qty}</span>;
    return <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-medium">🟢 {qty}</span>;
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Products</h2>
        <Button onClick={openNew} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1" /> Add Product
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-9 bg-card border-border text-foreground" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 bg-card border-border text-foreground"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-accent text-foreground' : 'text-muted-foreground'}`}><List className="h-4 w-4" /></button>
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-accent text-foreground' : 'text-muted-foreground'}`}><Grid3X3 className="h-4 w-4" /></button>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-accent border border-border flex-wrap">
          <span className="text-xs text-foreground font-medium">☑ {selectedIds.size} selected</span>
          <Button size="sm" variant="outline" className="text-xs border-border text-foreground h-7" onClick={() => bulkStatusMutation.mutate('active')}>Set Active</Button>
          <Button size="sm" variant="outline" className="text-xs border-border text-foreground h-7" onClick={() => bulkStatusMutation.mutate('draft')}>Draft</Button>
          <Button size="sm" variant="outline" className="text-xs border-border text-foreground h-7" onClick={() => bulkStatusMutation.mutate('archived')}>Archive</Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : viewMode === 'list' ? (
        <motion.div className="space-y-1" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.03 } } }}>
          {products?.map((p) => (
            <motion.div
              key={p.id}
              variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
              className="flex items-center gap-2 rounded-lg border border-border bg-card p-2.5 hover:bg-secondary transition-colors"
            >
              <Checkbox checked={selectedIds.has(p.id)} onCheckedChange={() => toggleSelect(p.id)} />
              <button
                onClick={(e) => { e.stopPropagation(); toggleFeatured.mutate({ id: p.id, featured: !(p as any).is_featured, name: p.name }); }}
                className="shrink-0"
                title={(p as any).is_featured ? 'Unfeature' : 'Feature'}
              >
                <Star className={`h-4 w-4 ${(p as any).is_featured ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
              </button>
              <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => openEdit(p)}>
                {getMainImage(p) ? (
                  <img src={getMainImage(p)} alt="" className="h-10 w-10 rounded object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded bg-accent flex items-center justify-center"><ImageIcon className="h-4 w-4 text-muted-foreground" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{(p as any).categories?.name ?? 'No category'}</p>
                </div>
                <span className="text-sm font-medium text-foreground">Rs. {p.price?.toLocaleString()}</span>
                {stockBadge(p.stock_qty)}
                <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${p.status === 'active' ? 'bg-green-500/20 text-green-400' : p.status === 'draft' ? 'bg-amber-500/20 text-amber-400' : 'bg-accent text-muted-foreground'}`}>{p.status}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 rounded hover:bg-accent"><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-card border-border" align="end">
                  <DropdownMenuItem onClick={() => openEdit(p)} className="text-foreground"><Edit2 className="h-3.5 w-3.5 mr-2" /> Edit</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => duplicateMutation.mutate(p)} className="text-foreground"><Copy className="h-3.5 w-3.5 mr-2" /> Duplicate</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDeleteTarget({ id: p.id, name: p.name })} className="text-destructive"><Trash2 className="h-3.5 w-3.5 mr-2" /> Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {products?.map((p) => (
            <div key={p.id} className="rounded-lg border border-border bg-card overflow-hidden hover:bg-secondary cursor-pointer transition-colors relative">
              <div className="absolute top-2 right-2 z-10 flex gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFeatured.mutate({ id: p.id, featured: !(p as any).is_featured, name: p.name }); }}
                  className="p-1 rounded-full bg-card/80 backdrop-blur-sm"
                >
                  <Star className={`h-4 w-4 ${(p as any).is_featured ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 rounded-full bg-card/80 backdrop-blur-sm"><MoreHorizontal className="h-4 w-4 text-muted-foreground" /></button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-card border-border" align="end">
                    <DropdownMenuItem onClick={() => openEdit(p)} className="text-foreground"><Edit2 className="h-3.5 w-3.5 mr-2" /> Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => duplicateMutation.mutate(p)} className="text-foreground"><Copy className="h-3.5 w-3.5 mr-2" /> Duplicate</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDeleteTarget({ id: p.id, name: p.name })} className="text-destructive"><Trash2 className="h-3.5 w-3.5 mr-2" /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div onClick={() => openEdit(p)}>
                {getMainImage(p) ? (
                  <img src={getMainImage(p)} alt="" className="w-full h-32 object-cover" />
                ) : (
                  <div className="w-full h-32 bg-accent flex items-center justify-center"><ImageIcon className="h-8 w-8 text-muted-foreground" /></div>
                )}
                <div className="p-3">
                  <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-primary font-medium">Rs. {p.price?.toLocaleString()}</span>
                    {stockBadge(p.stock_qty)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Form Dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) { setEditing(null); setForm(defaultProduct); setImages([]); } }}>
        <DialogContent className="admin-theme bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground font-body">{editing ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="basic" className="mt-2">
            <TabsList className="bg-accent border border-border w-full grid grid-cols-3 md:grid-cols-6">
              <TabsTrigger value="basic" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Basic</TabsTrigger>
              <TabsTrigger value="pricing" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Pricing</TabsTrigger>
              <TabsTrigger value="stock" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Stock</TabsTrigger>
              <TabsTrigger value="images" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Images</TabsTrigger>
              <TabsTrigger value="description" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Details</TabsTrigger>
              <TabsTrigger value="seo" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">SEO</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-3 mt-3">
              <div><Label className="text-foreground text-xs">Product Name *</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="bg-background border-border text-foreground mt-1" /></div>
              <div><Label className="text-foreground text-xs">Slug</Label><Input value={form.slug} onChange={(e) => setForm({...form, slug: e.target.value})} className="bg-background border-border text-foreground mt-1" placeholder="auto-generated" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-foreground text-xs">Category</Label>
                  <Select value={form.category_id ?? ''} onValueChange={(v) => setForm({...form, category_id: v || null})}>
                    <SelectTrigger className="bg-background border-border text-foreground mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-foreground text-xs">Collection</Label>
                  <Select value={form.collection_id ?? ''} onValueChange={(v) => setForm({...form, collection_id: v || null})}>
                    <SelectTrigger className="bg-background border-border text-foreground mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {collections?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-foreground text-xs">Gender</Label>
                  <Select value={form.gender} onValueChange={(v: any) => setForm({...form, gender: v})}>
                    <SelectTrigger className="bg-background border-border text-foreground mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="unisex">Unisex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-foreground text-xs">Status</Label>
                  <Select value={form.status} onValueChange={(v: any) => setForm({...form, status: v})}>
                    <SelectTrigger className="bg-background border-border text-foreground mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-3 mt-3">
              <div><Label className="text-foreground text-xs">Price (Rs.) *</Label><Input type="number" value={form.price} onChange={(e) => setForm({...form, price: +e.target.value})} className="bg-background border-border text-foreground mt-1" /></div>
              <div><Label className="text-foreground text-xs">Original Price (Rs.)</Label><Input type="number" value={form.original_price ?? ''} onChange={(e) => setForm({...form, original_price: e.target.value ? +e.target.value : null})} className="bg-background border-border text-foreground mt-1" /></div>
              <div className="flex items-center gap-3">
                <Switch checked={form.is_on_sale} onCheckedChange={(v) => setForm({...form, is_on_sale: v})} />
                <Label className="text-foreground text-xs">On Sale</Label>
                {form.is_on_sale && form.original_price && form.price < form.original_price && (
                  <span className="text-xs px-2 py-0.5 rounded bg-destructive/20 text-destructive font-medium">
                    {Math.round((1 - form.price / form.original_price) * 100)}% OFF
                  </span>
                )}
              </div>
            </TabsContent>

            <TabsContent value="stock" className="space-y-3 mt-3">
              <div><Label className="text-foreground text-xs">Stock Quantity</Label><Input type="number" value={form.stock_qty} onChange={(e) => setForm({...form, stock_qty: +e.target.value})} className="bg-background border-border text-foreground mt-1" /></div>
              <div><Label className="text-foreground text-xs">Low Stock Alert</Label><Input type="number" value={form.low_stock_alert} onChange={(e) => setForm({...form, low_stock_alert: +e.target.value})} className="bg-background border-border text-foreground mt-1" /></div>
              <div><Label className="text-foreground text-xs">SKU</Label><Input value={form.sku} onChange={(e) => setForm({...form, sku: e.target.value})} className="bg-background border-border text-foreground mt-1" /></div>
              <div className="flex items-center gap-3">
                <Switch checked={form.track_inventory} onCheckedChange={(v) => setForm({...form, track_inventory: v})} />
                <Label className="text-foreground text-xs">Track Inventory</Label>
              </div>
            </TabsContent>

            <TabsContent value="images" className="space-y-3 mt-3">
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }} />
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${dragOver ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
              >
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Drop images here or click to upload</p>
                <p className="text-xs text-muted-foreground mt-1">Up to 6 images · Max 5MB each · JPG, PNG, WebP</p>
              </div>
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {images.map((img, index) => (
                    <div key={index} className="relative group rounded-lg overflow-hidden border border-border bg-background">
                      <img src={img.url} alt={`Product image ${index + 1}`} className="w-full h-24 object-cover" />
                      {img.is_main && (
                        <span className="absolute top-1 left-1 flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded bg-primary text-primary-foreground font-medium">
                          <Star className="h-2.5 w-2.5" /> Main
                        </span>
                      )}
                      {/* SAVED / NEW badge */}
                      <span className={`absolute bottom-1 right-1 text-[9px] px-1.5 py-0.5 rounded font-medium ${img.id ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {img.id ? 'SAVED' : 'NEW'}
                      </span>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        {!img.is_main && (
                          <button onClick={(e) => { e.stopPropagation(); setMainImage(index); }} className="p-1.5 rounded bg-primary/80 hover:bg-primary text-primary-foreground" title="Set as main">
                            <Star className="h-3 w-3" />
                          </button>
                        )}
                        {index > 0 && (
                          <button onClick={(e) => { e.stopPropagation(); moveImage(index, index - 1); }} className="p-1.5 rounded bg-white/20 hover:bg-white/30 text-white" title="Move left">
                            <ChevronLeft className="h-3 w-3" />
                          </button>
                        )}
                        {index < images.length - 1 && (
                          <button onClick={(e) => { e.stopPropagation(); moveImage(index, index + 1); }} className="p-1.5 rounded bg-white/20 hover:bg-white/30 text-white" title="Move right">
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); removeImage(index); }} className="p-1.5 rounded bg-destructive/80 hover:bg-destructive text-white" title="Remove">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">{images.length}/6 images · Hover to set main, reorder, or remove</p>
            </TabsContent>

            <TabsContent value="description" className="space-y-3 mt-3">
              <div><Label className="text-foreground text-xs">Description</Label><Textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="bg-background border-border text-foreground mt-1 min-h-[100px]" /></div>
              <div><Label className="text-foreground text-xs">Material & Care</Label><Textarea value={form.material_care} onChange={(e) => setForm({...form, material_care: e.target.value})} className="bg-background border-border text-foreground mt-1" /></div>
              <div><Label className="text-foreground text-xs">Shipping Info</Label><Textarea value={form.shipping_info} onChange={(e) => setForm({...form, shipping_info: e.target.value})} className="bg-background border-border text-foreground mt-1" /></div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-3 mt-3">
              <div><Label className="text-foreground text-xs">Tags (comma-separated)</Label><Input value={form.tags.join(', ')} onChange={(e) => setForm({...form, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)})} className="bg-background border-border text-foreground mt-1" /></div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 mt-4 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => saveMutation.mutate({ overrideStatus: 'draft' })} className="flex-1 border-border text-foreground" disabled={saveMutation.isPending || uploading || !form.name}>
              Save as Draft
            </Button>
            <Button onClick={() => saveMutation.mutate({ overrideStatus: 'active' })} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" disabled={saveMutation.isPending || uploading || !form.name}>
              {uploading ? 'Uploading images...' : saveMutation.isPending ? 'Saving...' : editing ? 'Save Changes' : 'Publish'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="admin-theme bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">🗑️ Delete Product</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Permanently delete <strong className="text-foreground">{deleteTarget?.name}</strong>? This cannot be undone. All images and variants will also be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="border-border text-foreground">Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
