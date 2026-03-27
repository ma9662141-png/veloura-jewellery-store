import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const COLORS = ['#c9a96e', '#d4a853', '#b8860b', '#deb887', '#cd853f'];
const tooltipStyle = { backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#f5f5f5', fontSize: 12 };

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);

  const { data: revenue } = useQuery({
    queryKey: ['analytics-revenue', days],
    queryFn: async () => {
      const { data } = await supabase.from('v_daily_revenue').select('*').order('day', { ascending: true }).limit(days);
      return data ?? [];
    },
  });

  const { data: byCategory } = useQuery({
    queryKey: ['analytics-category'],
    queryFn: async () => {
      const { data } = await supabase.from('v_revenue_by_category').select('*');
      return data ?? [];
    },
  });

  const { data: byPayment } = useQuery({
    queryKey: ['analytics-payment'],
    queryFn: async () => {
      const { data } = await supabase.from('v_revenue_by_payment').select('*');
      return data ?? [];
    },
  });

  const { data: byCity } = useQuery({
    queryKey: ['analytics-city'],
    queryFn: async () => {
      const { data } = await supabase.from('v_revenue_by_city').select('*').order('revenue', { ascending: false }).limit(10);
      return data ?? [];
    },
  });

  const { data: lowStock } = useQuery({
    queryKey: ['analytics-low-stock'],
    queryFn: async () => {
      const { data } = await supabase.from('v_low_stock_products').select('*').order('stock_qty', { ascending: true });
      return data ?? [];
    },
  });

  const exportCSV = async () => {
    const { data } = await supabase
      .from('orders')
      .select('order_number, delivery_name, delivery_city, total, status, payment_method, created_at')
      .order('created_at', { ascending: false })
      .limit(1000);
    if (!data) return;
    const header = 'Order,Name,City,Total,Status,Payment,Date\n';
    const rows = data.map((o) => `${o.order_number},${o.delivery_name},${o.delivery_city},${o.total},${o.status},${o.payment_method},${o.created_at}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'veloura-orders.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Analytics</h2>
        <Button onClick={exportCSV} variant="outline" size="sm" className="border-border text-foreground">
          <Download className="h-4 w-4 mr-1" /> Export CSV
        </Button>
      </div>

      {/* Period */}
      <div className="flex gap-1">
        {[{ l: '7D', v: 7 }, { l: '30D', v: 30 }, { l: '3M', v: 90 }, { l: '6M', v: 180 }, { l: '1Y', v: 365 }].map((p) => (
          <button key={p.v} onClick={() => setDays(p.v)} className={`px-2.5 py-1 text-xs rounded-md transition-colors ${days === p.v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}>{p.l}</button>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Revenue Over Time</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={revenue ?? []}>
            <defs><linearGradient id="gGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c9a96e" stopOpacity={0.3} /><stop offset="100%" stopColor="#c9a96e" stopOpacity={0} /></linearGradient></defs>
            <XAxis dataKey="day" tickFormatter={(v) => format(new Date(v), 'dd MMM')} tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`Rs. ${v.toLocaleString()}`, 'Revenue']} />
            <Area type="monotone" dataKey="revenue" stroke="#c9a96e" strokeWidth={2} fill="url(#gGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* By Category */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Revenue by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byCategory ?? []} layout="vertical">
              <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="category" type="category" tick={{ fill: '#9ca3af', fontSize: 10 }} width={80} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`Rs. ${v.toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#c9a96e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By Payment */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Payment Methods</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={byPayment ?? []} dataKey="revenue" nameKey="payment_method" cx="50%" cy="50%" outerRadius={80} paddingAngle={3}>
                {(byPayment ?? []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend formatter={(v) => <span className="text-xs text-foreground capitalize">{v}</span>} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`Rs. ${v.toLocaleString()}`, 'Revenue']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* By City */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Top Cities</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={byCity ?? []}>
            <XAxis dataKey="city" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`Rs. ${v.toLocaleString()}`, 'Revenue']} />
            <Bar dataKey="revenue" fill="#c9a96e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Inventory Health */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Inventory Health</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="pb-2 font-medium">Product</th>
                <th className="pb-2 font-medium">Category</th>
                <th className="pb-2 font-medium">Stock</th>
                <th className="pb-2 font-medium">Alert</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {lowStock?.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="py-2 text-foreground">{p.name}</td>
                  <td className="py-2 text-muted-foreground">{p.category}</td>
                  <td className="py-2 text-foreground">{p.stock_qty}</td>
                  <td className="py-2 text-muted-foreground">{p.low_stock_alert}</td>
                  <td className="py-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      p.stock_status === 'out_of_stock' ? 'bg-red-500/20 text-red-400'
                      : p.stock_status === 'low' ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-green-500/20 text-green-400'
                    }`}>
                      {p.stock_status === 'out_of_stock' ? '🔴 Critical' : p.stock_status === 'low' ? '🟡 Low' : '🟢 Healthy'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
