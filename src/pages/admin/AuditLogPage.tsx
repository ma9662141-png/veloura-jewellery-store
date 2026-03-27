import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { Shield, UserX, UserCheck, Trash2, Copy, Eye, EyeOff, Tag, Package, AlertTriangle } from 'lucide-react';

const actionIcons: Record<string, any> = {
  blocked_user: UserX,
  unblocked_user: UserCheck,
  deleted_review: Trash2,
  hid_review: EyeOff,
  showed_review: Eye,
  duplicated_product: Copy,
  created_code: Tag,
  updated_status: Package,
  cancelled_order: AlertTriangle,
  refunded_order: AlertTriangle,
  toggled_featured: Package,
};

const actionColors: Record<string, string> = {
  blocked_user: 'text-red-400 bg-red-500/10',
  unblocked_user: 'text-green-400 bg-green-500/10',
  deleted_review: 'text-red-400 bg-red-500/10',
  hid_review: 'text-muted-foreground bg-accent',
  showed_review: 'text-green-400 bg-green-500/10',
  duplicated_product: 'text-blue-400 bg-blue-500/10',
  created_code: 'text-primary bg-primary/10',
  updated_status: 'text-blue-400 bg-blue-500/10',
  cancelled_order: 'text-amber-400 bg-amber-500/10',
  refunded_order: 'text-amber-400 bg-amber-500/10',
  toggled_featured: 'text-primary bg-primary/10',
};

export default function AuditLogPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['admin-audit-log'],
    queryFn: async () => {
      const { data } = await supabase
        .from('admin_audit_log')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(100);
      return data ?? [];
    },
  });

  const getDescription = (log: any) => {
    const data = log.new_data as any;
    const name = data?.name ?? data?.code ?? data?.order_number ?? log.entity_id?.slice(0, 8) ?? '';
    const actionLabel = log.action?.replace(/_/g, ' ');
    return { actionLabel, entityName: name };
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Audit Log</h2>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : logs?.length === 0 ? (
        <p className="text-center py-16 text-muted-foreground">No activity yet</p>
      ) : (
        <motion.div className="space-y-1" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.03 } } }}>
          {logs?.map((log) => {
            const Icon = actionIcons[log.action] ?? Shield;
            const color = actionColors[log.action] ?? 'text-muted-foreground bg-accent';
            const { actionLabel, entityName } = getDescription(log);
            return (
              <motion.div
                key={log.id}
                variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{(log as any).profiles?.full_name ?? 'Admin'}</span>
                    {' · '}
                    <span className="capitalize">{actionLabel}</span>
                  </p>
                  {entityName && <p className="text-xs text-muted-foreground truncate">{entityName}</p>}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                </span>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
