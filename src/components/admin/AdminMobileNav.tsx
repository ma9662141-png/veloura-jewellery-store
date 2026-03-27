import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, BarChart3, MoreHorizontal, Users, Settings, LogOut, Star, Tag, ScrollText, Layers } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const tabs = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dash', end: true },
  { to: '/admin/orders', icon: Package, label: 'Orders' },
  { to: '/admin/products', icon: ShoppingBag, label: 'Products' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
];

export function AdminMobileNav({ pendingCount }: { pendingCount: number }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    setMoreOpen(false);
    await signOut();
    navigate('/');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-border bg-card">
      <nav className="flex items-center justify-around h-14">
        {tabs.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors relative pt-1.5 ${
                isActive
                  ? 'text-primary border-t-2 border-primary -mt-[2px]'
                  : 'text-muted-foreground'
              }`
            }
          >
            <Icon className="h-4.5 w-4.5" />
            <span>{label}</span>
            {label === 'Orders' && pendingCount > 0 && (
              <span className="absolute -top-0.5 right-0 text-[8px] font-bold bg-amber-500 text-white px-1 rounded-full min-w-[14px] text-center">
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-muted-foreground pt-1.5">
              <MoreHorizontal className="h-4.5 w-4.5" />
              <span>More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="admin-theme bg-card border-border rounded-t-2xl">
            <SheetHeader>
              <SheetTitle className="text-foreground font-body">More Options</SheetTitle>
            </SheetHeader>
            <div className="py-4 space-y-1">
              <NavLink to="/admin/categories" onClick={() => setMoreOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-md text-sm text-foreground hover:bg-accent">
                <Layers className="h-4 w-4" /> Categories
              </NavLink>
              <NavLink to="/admin/customers" onClick={() => setMoreOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-md text-sm text-foreground hover:bg-accent">
                <Users className="h-4 w-4" /> Customers
              </NavLink>
              <NavLink to="/admin/reviews" onClick={() => setMoreOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-md text-sm text-foreground hover:bg-accent">
                <Star className="h-4 w-4" /> Reviews
              </NavLink>
              <NavLink to="/admin/discounts" onClick={() => setMoreOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-md text-sm text-foreground hover:bg-accent">
                <Tag className="h-4 w-4" /> Discounts
              </NavLink>
              <NavLink to="/admin/settings" onClick={() => setMoreOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-md text-sm text-foreground hover:bg-accent">
                <Settings className="h-4 w-4" /> Settings
              </NavLink>
              <NavLink to="/admin/audit-log" onClick={() => setMoreOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-md text-sm text-foreground hover:bg-accent">
                <ScrollText className="h-4 w-4" /> Audit Log
              </NavLink>
              <button onClick={handleSignOut} className="flex items-center gap-3 px-3 py-3 rounded-md text-sm text-destructive hover:bg-accent w-full">
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
}
