import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function checkBlocked(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('is_active')
    .eq('id', userId)
    .single();
  return data?.is_active === false;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleSession = async (sess: Session | null) => {
    if (sess?.user) {
      const blocked = await checkBlocked(sess.user.id);
      if (blocked) {
        await supabase.auth.signOut();
        toast.error('Your account has been suspended. Contact support via WhatsApp.');
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }
    }
    setSession(sess);
    setUser(sess?.user ?? null);
    setLoading(false);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
