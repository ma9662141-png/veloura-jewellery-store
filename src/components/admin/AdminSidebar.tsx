import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Users, BarChart3, Settings, LogOut, Star, Tag, ScrollText, Layers } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { NotificationBell } from './NotificationBell';

const links = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/orders', icon: Package, label: 'Orders' },
  { to: '/admin/products', icon: ShoppingBag, label: 'Products' },
  { to: '/admin/categories', icon: Layers, label: 'Categories' },
  { to: '/admin/customers', icon: Users, label: 'Customers' },
  { to: '/admin/reviews', icon: Star, label: 'Reviews' },
  { to: '/admin/discounts', icon: Tag, label: 'Discounts' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
  { to: '/admin/audit-log', icon: ScrollText, label: 'Audit Log' },
];

export function AdminSidebar({ pendingCount }: { pendingCount: number }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 border-r border-border bg-card z-30">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
        <div className="flex flex-col leading-none">
          <span className="font-body font-bold text-lg tracking-wider text-primary">Veloura</span>
          <span className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground">Admin Panel</span>
        </div>
        <div className="ml-auto">
          <NotificationBell />
        </div>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-3 overflow-y-auto">
        {links.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'text-primary bg-primary/10 border-l-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{label}</span>
            {label === 'Orders' && pendingCount > 0 && (
              <span className="ml-auto text-[10px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border px-4 py-4">
        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        <button
          onClick={handleSignOut}
          className="mt-2 flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
