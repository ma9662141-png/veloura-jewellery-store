import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ShoppingBag, Heart, MapPin, Shield, Menu, X, LogOut } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const tabs = [
  { label: 'Profile', path: '/account', icon: User, end: true },
  { label: 'My Orders', path: '/account/orders', icon: ShoppingBag },
  { label: 'Wishlist', path: '/account/wishlist', icon: Heart },
  { label: 'Addresses', path: '/account/addresses', icon: MapPin },
  { label: 'Security', path: '/account/security', icon: Shield },
];

export default function AccountLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ full_name: string | null; total_orders: number; total_spent: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('full_name, total_orders, total_spent')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setProfile(data));
  }, [user]);

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container py-8">
        {/* Mobile header */}
        <div className="mb-6 flex items-center justify-between md:hidden">
          <h1 className="font-display text-2xl font-bold">My Account</h1>
          <Button variant="outline" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden w-64 shrink-0 md:block">
            <SidebarContent
              displayName={displayName}
              email={user?.email || ''}
              initials={initials}
              totalOrders={profile?.total_orders ?? 0}
              totalSpent={profile?.total_spent ?? 0}
              onSignOut={handleSignOut}
            />
          </aside>

          {/* Mobile sidebar drawer */}
          <AnimatePresence>
            {sidebarOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-charcoal/50"
                  onClick={() => setSidebarOpen(false)}
                />
                <motion.aside
                  initial={{ x: -300 }}
                  animate={{ x: 0 }}
                  exit={{ x: -300 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                  className="fixed inset-y-0 left-0 z-50 w-72 bg-card p-6 shadow-xl"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="font-display text-lg font-bold">My Account</h2>
                    <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <SidebarContent
                    displayName={displayName}
                    email={user?.email || ''}
                    initials={initials}
                    totalOrders={profile?.total_orders ?? 0}
                    totalSpent={profile?.total_spent ?? 0}
                    onNavigate={() => setSidebarOpen(false)}
                    onSignOut={handleSignOut}
                  />
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          {/* Main content */}
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="min-w-0 flex-1"
          >
            <Outlet />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function SidebarContent({
  displayName,
  email,
  initials,
  totalOrders,
  totalSpent,
  onNavigate,
  onSignOut,
}: {
  displayName: string;
  email: string;
  initials: string;
  totalOrders: number;
  totalSpent: number;
  onNavigate?: () => void;
  onSignOut: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Avatar card */}
      <div className="rounded-xl bg-card p-5 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground font-display">
          {initials}
        </div>
        <h3 className="font-body text-sm font-semibold">{displayName}</h3>
        <p className="font-body text-xs text-muted-foreground">{email}</p>
        <div className="mt-3 flex justify-center gap-4 border-t border-border pt-3 font-body text-xs text-muted-foreground">
          <span><strong className="text-foreground">{totalOrders}</strong> orders</span>
          <span><strong className="text-foreground">Rs. {totalSpent.toLocaleString()}</strong> spent</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-1">
        {tabs.map(({ label, path, icon: Icon, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-lg px-4 py-2.5 font-body text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            activeClassName="bg-primary/10 text-primary font-medium hover:bg-primary/10"
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Sign out */}
      <button
        onClick={onSignOut}
        className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 font-body text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </div>
  );
}
