import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Mail } from 'lucide-react';
import { VelouraLogo } from '@/components/shared/VelouraLogo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 pt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center">
          <Link to="/">
            <VelouraLogo size="lg" />
          </Link>
          <h1 className="mt-6 font-display text-3xl font-bold">Reset Password</h1>
          <p className="mt-2 font-body text-sm text-muted-foreground">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        {sent ? (
          <div className="rounded-xl bg-card p-8 text-center shadow-sm">
            <Mail className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h2 className="font-display text-xl font-semibold">Check Your Email</h2>
            <p className="mt-2 font-body text-sm text-muted-foreground">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <Link to="/login">
              <Button variant="outline" className="mt-6 rounded-full font-body">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 rounded-xl bg-card p-6 shadow-sm">
            <div className="space-y-2">
              <Label className="font-body text-sm">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="font-body"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full rounded-full font-body">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        )}

        <p className="text-center">
          <Link to="/login" className="font-body text-sm text-primary hover:underline">
            <ArrowLeft className="mr-1 inline h-3 w-3" /> Back to Login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
