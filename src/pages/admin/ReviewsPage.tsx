import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Star, Eye, EyeOff, Trash2, Flag, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

type FilterType = 'all' | 'visible' | 'hidden' | 'flagged' | 'verified';
type SortType = 'newest' | 'lowest' | 'highest';

export default function ReviewsPage() {
  const { user: adminUser } = useAuth();
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('newest');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['admin-reviews', filter, sort, search],
    queryFn: async () => {
      let q = supabase
        .from('reviews')
        .select('*, profiles(full_name)')
        .limit(200);

      if (filter === 'visible') q = q.eq('is_visible', true);
      if (filter === 'hidden') q = q.eq('is_visible', false);
      if (filter === 'flagged') q = q.eq('is_flagged', true);
      if (filter === 'verified') q = q.eq('is_verified', true);

      if (search.trim()) q = q.or(`title.ilike.%${search.trim()}%,body.ilike.%${search.trim()}%`);

      if (sort === 'newest') q = q.order('created_at', { ascending: false });
      if (sort === 'lowest') q = q.order('rating', { ascending: true });
      if (sort === 'highest') q = q.order('rating', { ascending: false });

      const { data } = await q;
      return data ?? [];
    },
  });

  // Fetch product names for display
  const productIds = [...new Set(reviews?.map((r) => r.product_id) ?? [])];
  const { data: products } = useQuery({
    queryKey: ['admin-review-products', productIds.join(',')],
    queryFn: async () => {
      if (productIds.length === 0) return {};
      const { data } = await supabase.from('products').select('id, name').in('id', productIds);
      return Object.fromEntries((data ?? []).map((p) => [p.id, p.name]));
    },
    enabled: productIds.length > 0,
  });

  const toggleVisibility = useMutation({
    mutationFn: async ({ id, visible }: { id: string; visible: boolean }) => {
      const { error } = await supabase.from('reviews').update({ is_visible: visible }).eq('id', id);
      if (error) throw error;
      await supabase.from('admin_audit_log').insert({
        admin_id: adminUser?.id,
        action: visible ? 'showed_review' : 'hid_review',
        entity_type: 'review',
        entity_id: id,
      });
    },
    onSuccess: () => {
      toast.success('Review updated');
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
  });

  const toggleFlag = useMutation({
    mutationFn: async ({ id, flagged }: { id: string; flagged: boolean }) => {
      const { error } = await supabase.from('reviews').update({ is_flagged: flagged } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Review flagged');
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
  });

  const deleteReview = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw error;
      await supabase.from('admin_audit_log').insert({
        admin_id: adminUser?.id,
        action: 'deleted_review',
        entity_type: 'review',
        entity_id: id,
      });
    },
    onSuccess: () => {
      toast.success('Review deleted');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
  });

  const bulkAction = useMutation({
    mutationFn: async (action: 'hide' | 'show' | 'delete') => {
      const ids = [...selected];
      if (action === 'delete') {
        const { error } = await supabase.from('reviews').delete().in('id', ids);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('reviews').update({ is_visible: action === 'show' }).in('id', ids);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Bulk action completed');
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    },
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filters: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'visible', label: 'Visible' },
    { value: 'hidden', label: 'Hidden' },
    { value: 'flagged', label: 'Flagged' },
    { value: 'verified', label: 'Verified' },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Reviews</h2>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reviews..." className="pl-9 bg-card border-border text-foreground" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 text-xs rounded-md capitalize transition-colors ${
              filter === f.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="ml-auto flex gap-1">
          {(['newest', 'lowest', 'highest'] as SortType[]).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`px-2 py-1.5 text-xs rounded-md capitalize transition-colors ${
                sort === s ? 'bg-accent text-foreground' : 'text-muted-foreground'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-accent border border-border">
          <span className="text-xs text-foreground font-medium">☑ {selected.size} selected</span>
          <Button size="sm" variant="outline" className="text-xs border-border text-foreground h-7" onClick={() => bulkAction.mutate('show')}>
            Mark Visible
          </Button>
          <Button size="sm" variant="outline" className="text-xs border-border text-foreground h-7" onClick={() => bulkAction.mutate('hide')}>
            Hide Selected
          </Button>
          <Button size="sm" variant="outline" className="text-xs border-destructive text-destructive h-7" onClick={() => bulkAction.mutate('delete')}>
            Delete Selected
          </Button>
        </div>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : reviews?.length === 0 ? (
        <p className="text-center py-16 text-muted-foreground">No reviews found</p>
      ) : (
        <motion.div className="space-y-2" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.03 } } }}>
          {reviews?.map((r) => (
            <motion.div
              key={r.id}
              variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
              className={`rounded-lg border bg-card p-3 transition-colors ${
                !r.is_visible ? 'opacity-60 bg-accent/50 border-border' : (r as any).is_flagged ? 'border-l-2 border-l-amber-500 border-border' : 'border-border'
              }`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selected.has(r.id)}
                  onCheckedChange={() => toggleSelect(r.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < r.rating ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-foreground font-medium">{(r as any).profiles?.full_name ?? 'Anonymous'}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(r.created_at), 'MMM dd yyyy')}</span>
                    {r.is_verified && <span className="text-[10px] text-green-400">✅ Verified</span>}
                    {!r.is_visible && <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-muted-foreground font-medium">HIDDEN</span>}
                    {(r as any).is_flagged && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">FLAGGED</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{products?.[r.product_id] ?? 'Unknown product'}</p>
                  {r.title && <p className="text-sm text-foreground font-medium mt-1">{r.title}</p>}
                  {r.body && <p className="text-sm text-muted-foreground mt-0.5">"{r.body}"</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleVisibility.mutate({ id: r.id, visible: !r.is_visible })}
                    className="p-1.5 rounded hover:bg-accent text-muted-foreground"
                    title={r.is_visible ? 'Hide' : 'Show'}
                  >
                    {r.is_visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => toggleFlag.mutate({ id: r.id, flagged: !(r as any).is_flagged })}
                    className={`p-1.5 rounded hover:bg-accent ${(r as any).is_flagged ? 'text-amber-400' : 'text-muted-foreground'}`}
                    title="Flag"
                  >
                    <Flag className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(r.id)}
                    className="p-1.5 rounded hover:bg-destructive/10 text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Delete Confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="admin-theme bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground font-body">Delete Review?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="border-border text-foreground">Cancel</Button>
            <Button className="bg-destructive text-destructive-foreground" onClick={() => deleteTarget && deleteReview.mutate(deleteTarget)} disabled={deleteReview.isPending}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
