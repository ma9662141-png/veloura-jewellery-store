import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Heart, ShoppingBag, Menu, X, User, Settings } from 'lucide-react';
import { VelouraLogo } from '@/components/shared/VelouraLogo';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'Collections', href: '/collections' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  const { items } = useCart();
  const { user } = useAuth();
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => setMobileOpen(false), [location]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-card/95 backdrop-blur-md shadow-sm border-b border-primary/20'
            : 'bg-transparent'
        }`}
      >
        <div className="container flex h-16 items-center justify-between md:h-20">
          <Link to="/" className="shrink-0">
            <VelouraLogo size="md" />
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`nav-link-underline font-body text-sm font-medium tracking-wide transition-colors hover:text-primary ${
                  location.pathname === link.href ? 'text-primary active' : 'text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button className="p-2 transition-colors hover:text-primary" aria-label="Search">
              <Search className="h-5 w-5" />
            </button>
            <Link to={user ? '/account/wishlist' : '/login'} className="relative p-2 transition-colors hover:text-primary" aria-label="Wishlist">
              <Heart className="h-5 w-5" />
            </Link>
            <Link to="/cart" className="relative p-2 transition-colors hover:text-primary" aria-label="Cart">
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {cartCount}
                </span>
              )}
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="hidden md:flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 font-body text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                aria-label="Admin Panel"
                title="Admin Panel"
              >
                <Settings className="h-3.5 w-3.5" />
                Admin
              </Link>
            )}
            <Link
              to={user ? '/account' : '/login'}
              className="p-2 transition-colors hover:text-primary"
              aria-label="Account"
            >
              <User className="h-5 w-5" />
            </Link>
            <button
              className="p-2 md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-card"
          >
            <div className="container flex h-16 items-center justify-between">
              <VelouraLogo size="md" />
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="container flex flex-col gap-6 pt-8">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={link.href}
                    className="font-display text-3xl font-semibold tracking-wide transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              {isAdmin && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: NAV_LINKS.length * 0.05 }}
                >
                  <Link
                    to="/admin"
                    className="flex items-center gap-3 font-display text-3xl font-semibold tracking-wide text-primary hover:text-primary/80"
                  >
                    <Settings className="h-7 w-7" />
                    Admin
                  </Link>
                </motion.div>
              )}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (NAV_LINKS.length + (isAdmin ? 1 : 0)) * 0.05 }}
              >
                <Link
                  to={user ? '/account' : '/login'}
                  className="font-display text-3xl font-semibold tracking-wide transition-colors hover:text-primary"
                >
                  {user ? 'My Account' : 'Sign In'}
                </Link>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
