import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminMobileNav } from '@/components/admin/AdminMobileNav';
import { NotificationBell } from '@/components/admin/NotificationBell';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function AdminLayout() {
  const [pendingCount, setPendingCount] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .then(({ count }) => setPendingCount(count ?? 0));
  }, []);

  // Realtime notifications
  useEffect(() => {
    const channel = supabase
      .channel('admin-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const n = payload.new as any;
          if (n.type === 'new_order') {
            toast.success(n.title, { description: n.body, duration: 6000 });
          }
          if (n.type === 'low_stock') {
            toast.warning(n.title, { description: n.body, duration: 8000 });
          }
          queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
          queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
          queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return (
    <AdminGuard>
      <div className="admin-theme min-h-screen bg-background font-body">
        <AdminSidebar pendingCount={pendingCount} />
        <div className="md:pl-60">
          {/* Mobile header */}
          <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card sticky top-0 z-30">
            <div className="flex flex-col leading-none">
              <span className="font-bold text-sm tracking-wider text-primary">Veloura</span>
              <span className="text-[8px] tracking-[0.15em] uppercase text-muted-foreground">Admin</span>
            </div>
            <NotificationBell />
          </header>

          <motion.main
            className="p-4 md:p-6 pb-20 md:pb-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.main>
        </div>
        <AdminMobileNav pendingCount={pendingCount} />
      </div>
    </AdminGuard>
  );
}
