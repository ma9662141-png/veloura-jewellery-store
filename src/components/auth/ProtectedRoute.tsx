import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();
  const [checked, setChecked] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (!user) {
      setChecked(true);
      return;
    }
    supabase
      .from('profiles')
      .select('is_active')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.is_active === false) {
          setBlocked(true);
          signOut();
          toast.error('Your account has been suspended. Contact support via WhatsApp.');
        }
        setChecked(true);
      });
  }, [user, signOut]);

  if (loading || !checked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user || blocked) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
