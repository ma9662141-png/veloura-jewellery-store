import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Package, Users, AlertTriangle, DollarSign, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format } from 'date-fns';
import { useState } from 'react';

const containerVariants = { visible: { transition: { staggerChildren: 0.06 } } };
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

const statusColors: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  processing: '#8b5cf6',
  shipped: '#6366f1',
  delivered: '#22c55e',
  cancelled: '#ef4444',
};

const DONUT_COLORS = ['#c9a96e', '#d4a853', '#b8860b', '#deb887', '#cd853f', '#8b7355'];

export default function DashboardPage() {
  const [chartDays, setChartDays] = useState(7);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['admin-dashboard', 'summary'],
    queryFn: async () => {
      const { data } = await supabase.from('v_dashboard_summary').select('*').single();
      return data;
    },
    refetchInterval: 60000,
  });

  const { data: revenue } = useQuery({
    queryKey: ['admin-dashboard', 'revenue', chartDays],
    queryFn: async () => {
      const { data } = await supabase
        .from('v_daily_revenue')
        .select('*')
        .order('day', { ascending: true })
        .limit(chartDays);
      return data ?? [];
    },
  });

  const { data: topProducts } = useQuery({
    queryKey: ['admin-dashboard', 'top-products'],
    queryFn: async () => {
      const { data } = await supabase.from('v_top_products').select('*').limit(5);
      return data ?? [];
    },
  });

  const { data: categoryRevenue } = useQuery({
    queryKey: ['admin-dashboard', 'category-revenue'],
    queryFn: async () => {
      const { data } = await supabase.from('v_revenue_by_category').select('*');
      return data ?? [];
    },
  });

  const { data: recentOrders } = useQuery({
    queryKey: ['admin-dashboard', 'recent-orders'],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('id, order_number, delivery_name, delivery_city, total, status, created_at')
        .order('created_at', { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  const kpis = summary
    ? [
        {
          label: 'Revenue Today',
          value: `Rs. ${(summary.revenue_today ?? 0).toLocaleString()}`,
          icon: DollarSign,
          sub: `${summary.revenue_month?.toLocaleString() ?? 0} this month`,
          color: 'text-primary',
        },
        {
          label: 'Orders Today',
          value: summary.orders_today ?? 0,
          icon: Package,
          sub: `${summary.orders_pending ?? 0} pending`,
          color: 'text-blue-400',
        },
        {
          label: 'New Customers',
          value: summary.new_customers_month ?? 0,
          icon: Users,
          sub: `${summary.new_customers_today ?? 0} today`,
          color: 'text-green-400',
        },
        {
          label: 'Low Stock',
          value: (summary.low_stock_count ?? 0) + (summary.out_of_stock_count ?? 0),
          icon: AlertTriangle,
          sub: `${summary.out_of_stock_count ?? 0} out of stock`,
          color: 'text-amber-400',
        },
      ]
    : [];

  const pipelineStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

  return (
    <div className="space-y-6">
      {/* Status bar */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500" /> Store Live
        </span>
        <span>·</span>
        <span>🔔 {summary?.orders_pending ?? 0} pending</span>
        <span>·</span>
        <span>⚠️ {summary?.low_stock_count ?? 0} low stock</span>
      </div>

      {/* KPI Cards */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {summaryLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))
          : kpis.map((kpi) => (
              <motion.div
                key={kpi.label}
                variants={itemVariants}
                className="rounded-lg border border-border bg-card p-4 hover:bg-secondary transition-colors"
              >
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                  <span className="text-xs">{kpi.label}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{kpi.sub}</p>
              </motion.div>
            ))}
      </motion.div>

      {/* Revenue Chart */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Revenue</h3>
          <div className="flex gap-1">
            {[
              { label: '7D', val: 7 },
              { label: '30D', val: 30 },
              { label: '3M', val: 90 },
            ].map((p) => (
              <button
                key={p.val}
                onClick={() => setChartDays(p.val)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  chartDays === p.val
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={revenue ?? []}>
            <defs>
              <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c9a96e" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#c9a96e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              tickFormatter={(v) => format(new Date(v), 'dd MMM')}
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                color: '#f5f5f5',
                fontSize: 12,
              }}
              formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, 'Revenue']}
              labelFormatter={(v) => format(new Date(v), 'dd MMM yyyy')}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#c9a96e"
              strokeWidth={2}
              fill="url(#goldGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Orders Pipeline */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Orders Pipeline</h3>
        <div className="flex flex-wrap gap-2">
          {pipelineStatuses.map((s) => (
            <Link
              key={s}
              to={`/admin/orders?status=${s}`}
              className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs hover:bg-accent transition-colors"
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusColors[s] }} />
              <span className="capitalize text-foreground">{s}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Recent Orders */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Recent Orders</h3>
            <Link to="/admin/orders" className="text-xs text-primary hover:underline">View All</Link>
          </div>
          <div className="space-y-2">
            {recentOrders?.map((o) => (
              <div
                key={o.id}
                className={`flex items-center justify-between rounded-md px-3 py-2 text-xs border border-border ${
                  o.status === 'pending' ? 'border-l-2 border-l-amber-500 bg-amber-500/5' : ''
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-foreground">{o.order_number}</span>
                  <span className="text-muted-foreground">
                    {o.delivery_name} · {o.delivery_city}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-medium">Rs. {o.total?.toLocaleString()}</span>
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium capitalize"
                    style={{
                      backgroundColor: statusColors[o.status] + '20',
                      color: statusColors[o.status],
                    }}
                  >
                    {o.status}
                  </span>
                  <Link to={`/admin/orders?order=${o.id}`}>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Top Products</h3>
          <div className="space-y-2">
            {topProducts?.map((p) => (
              <div key={p.id} className="flex items-center gap-3 text-xs">
                {p.main_image ? (
                  <img src={p.main_image} alt={p.name ?? ''} className="h-8 w-8 rounded object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded bg-accent" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-medium truncate">{p.name}</p>
                  <p className="text-muted-foreground">
                    {p.units_sold} sold · Rs. {(p.revenue ?? 0).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`h-2 w-2 rounded-full ${
                    (p.stock_qty ?? 0) > 20
                      ? 'bg-green-500'
                      : (p.stock_qty ?? 0) > 5
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Donut */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Revenue by Category</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={categoryRevenue ?? []}
              dataKey="revenue"
              nameKey="category"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={3}
            >
              {(categoryRevenue ?? []).map((_, i) => (
                <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
              ))}
            </Pie>
            <Legend
              formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                color: '#f5f5f5',
                fontSize: 12,
              }}
              formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, 'Revenue']}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
