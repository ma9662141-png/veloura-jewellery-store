import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, ShieldCheck, LogOut, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';

function getStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  return score;
}
const STRENGTH_MAP = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLOR = ['', 'bg-destructive', 'bg-amber-400', 'bg-blue-500', 'bg-emerald-500'];

export default function SecurityPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const strength = useMemo(() => getStrength(newPw), [newPw]);
  const passwordsMatch = confirmPw.length > 0 && newPw === confirmPw;
  const isValid = strength >= 3 && passwordsMatch;

  const handleChangePassword = async () => {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      setNewPw('');
      setConfirmPw('');
      toast.success('Password changed successfully');
    }
  };

  const handleSignOutAll = async () => {
    await supabase.auth.signOut({ scope: 'global' });
    toast.success('Signed out from all devices');
    navigate('/login');
  };

  const handleDeleteRequest = () => {
    setDeleteOpen(false);
    setDeleteConfirm('');
    const whatsappUrl = `https://wa.me/923075323246?text=${encodeURIComponent('I want to delete my Veloura account. My email: ')}`;
    window.open(whatsappUrl, '_blank');
    toast.info('Please complete the deletion request via WhatsApp');
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold md:text-3xl">Security</h1>

      {/* Change Password */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-card p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-semibold">Change Password</h3>
        </div>

        <div className="max-w-md space-y-4">
          <div className="space-y-2">
            <Label className="font-body text-sm">New Password</Label>
            <div className="relative">
              <Input type={showNew ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)} className="pr-10 font-body" />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowNew(v => !v)}>
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {newPw.length > 0 && (
              <div className="space-y-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= strength ? STRENGTH_COLOR[strength] : 'bg-muted'}`} />
                  ))}
                </div>
                <p className={`font-body text-xs ${strength <= 1 ? 'text-destructive' : strength === 2 ? 'text-amber-600' : strength === 3 ? 'text-blue-600' : 'text-emerald-600'}`}>
                  {STRENGTH_MAP[strength]}
                </p>
                <ul className="space-y-0.5 font-body text-xs text-muted-foreground">
                  <li className={newPw.length >= 8 ? 'text-emerald-600' : ''}>✓ 8+ characters</li>
                  <li className={/[A-Z]/.test(newPw) ? 'text-emerald-600' : ''}>✓ Uppercase letter</li>
                  <li className={/[0-9]/.test(newPw) ? 'text-emerald-600' : ''}>✓ Number</li>
                  <li className={/[^a-zA-Z0-9]/.test(newPw) ? 'text-emerald-600' : ''}>✓ Special character</li>
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="font-body text-sm">Confirm New Password</Label>
            <Input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} className="font-body" />
            {confirmPw.length > 0 && !passwordsMatch && (
              <p className="font-body text-xs text-destructive">Passwords do not match</p>
            )}
          </div>

          <Button onClick={handleChangePassword} disabled={!isValid || saving} className="rounded-full font-body text-sm">
            {saving ? 'Changing...' : 'Change Password'}
          </Button>
        </div>
      </motion.div>

      {/* Sessions & Danger */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl bg-card p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-semibold">Sessions & Account</h3>
        </div>
        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start rounded-lg font-body text-sm" onClick={handleSignOutAll}>
            <LogOut className="mr-2 h-4 w-4" /> Sign Out All Devices
          </Button>

          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start rounded-lg border-destructive/30 font-body text-sm text-destructive hover:bg-destructive/10">
                <Trash2 className="mr-2 h-4 w-4" /> Delete My Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display text-destructive">Delete Account</DialogTitle>
                <DialogDescription className="font-body">
                  This action is permanent and cannot be undone. Type <strong>DELETE</strong> below to confirm, then you'll be redirected to WhatsApp to complete the request.
                </DialogDescription>
              </DialogHeader>
              <Input
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="font-body"
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)} className="font-body">Cancel</Button>
                <Button
                  variant="destructive"
                  disabled={deleteConfirm !== 'DELETE'}
                  onClick={handleDeleteRequest}
                  className="font-body"
                >
                  Continue to WhatsApp
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>
    </div>
  );
}
