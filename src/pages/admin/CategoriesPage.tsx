import { useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageIcon, Upload } from 'lucide-react';
import { toast } from 'sonner';

const SUPABASE_URL = "https://ftgaoadnxrodfgtsftoq.supabase.co";
const BUCKET = 'product-images';

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories-full'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('id, name, slug, emoji, image_url, is_active').order('sort_order');
      return data ?? [];
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('categories').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Category updated');
      queryClient.invalidateQueries({ queryKey: ['admin-categories-full'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const uploadImage = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const ext = file.name.split('.').pop();
      const path = `categories/${id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;
      const newUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
      const { error } = await supabase.from('categories').update({ image_url: newUrl }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Category image updated ✓');
      queryClient.invalidateQueries({ queryKey: ['admin-categories-full'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleFileChange = (id: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }
    uploadImage.mutate({ id, file });
  };

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Categories</h2>
      <div className="grid gap-3">
        {categories?.map((cat) => (
          <div key={cat.id} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
            {cat.image_url ? (
              <img src={cat.image_url} alt={cat.name} className="h-20 w-20 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="h-20 w-20 rounded-lg bg-accent flex items-center justify-center shrink-0">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">{cat.emoji}</span>
                <h3 className="text-sm font-medium text-foreground">{cat.name}</h3>
                {!cat.is_active && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">HIDDEN</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">/{cat.slug}</p>
              <div className="flex items-center gap-3 mt-2">
                <input
                  ref={(el) => { fileRefs.current[cat.id] = el; }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { handleFileChange(cat.id, e.target.files); e.target.value = ''; }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs border-border text-foreground h-7"
                  onClick={() => fileRefs.current[cat.id]?.click()}
                  disabled={uploadImage.isPending}
                >
                  <Upload className="h-3 w-3 mr-1" /> {uploadImage.isPending ? 'Uploading...' : 'Change Image'}
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground">{cat.is_active ? 'Active' : 'Hidden'}</span>
              <Switch
                checked={cat.is_active}
                onCheckedChange={(v) => toggleActive.mutate({ id: cat.id, is_active: v })}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
