import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Camera } from 'lucide-react';

const PAKISTANI_CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
  'Peshawar', 'Quetta', 'Multan', 'Sialkot', 'Hyderabad',
  'Gujranwala', 'Bahawalpur', 'Sargodha', 'Abbottabad', 'Mardan',
];

interface Profile {
  full_name: string | null;
  phone: string | null;
  city: string | null;
  gender: string | null;
  avatar_url: string | null;
  total_orders: number;
  total_spent: number;
  created_at: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('full_name, phone, city, gender, avatar_url, total_orders, total_spent, created_at')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error) toast.error('Failed to load profile');
        else setProfile(data);
        setLoading(false);
      });
  }, [user]);

  const handleSave = async () => {
    if (!user || !profile) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        city: profile.city,
        gender: profile.gender as any,
      })
      .eq('id', user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success('Profile updated successfully');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!profile) return null;

  const initials = (profile.full_name || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold md:text-3xl">Profile</h1>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-5 rounded-xl bg-card p-6 shadow-sm"
      >
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-3xl font-bold text-primary-foreground font-display">
            {initials}
          </div>
          <button className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-card shadow-md border border-border transition-colors hover:bg-muted">
            <Camera className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
        <div>
          <h2 className="font-body text-lg font-semibold">{profile.full_name || 'User'}</h2>
          <p className="font-body text-sm text-muted-foreground">{user?.email}</p>
          <p className="font-body text-xs text-muted-foreground mt-1">
            Member since {new Date(profile.created_at).toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl bg-card p-6 shadow-sm"
      >
        <h3 className="mb-5 font-display text-lg font-semibold">Personal Information</h3>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="font-body text-sm">Full Name</Label>
            <Input
              id="fullName"
              value={profile.full_name || ''}
              onChange={e => setProfile(p => p ? { ...p, full_name: e.target.value } : p)}
              className="font-body"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="font-body text-sm">Email</Label>
            <Input id="email" value={user?.email || ''} disabled className="font-body bg-muted/50" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="font-body text-sm">Phone</Label>
            <Input
              id="phone"
              value={profile.phone || ''}
              onChange={e => setProfile(p => p ? { ...p, phone: e.target.value } : p)}
              placeholder="+923001234567"
              className="font-body"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city" className="font-body text-sm">City</Label>
            <Select
              value={profile.city || ''}
              onValueChange={v => setProfile(p => p ? { ...p, city: v } : p)}
            >
              <SelectTrigger id="city" className="font-body">
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                {PAKISTANI_CITIES.map(c => (
                  <SelectItem key={c} value={c} className="font-body">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender" className="font-body text-sm">Gender</Label>
            <Select
              value={profile.gender || ''}
              onValueChange={v => setProfile(p => p ? { ...p, gender: v } : p)}
            >
              <SelectTrigger id="gender" className="font-body">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="female" className="font-body">Female</SelectItem>
                <SelectItem value="male" className="font-body">Male</SelectItem>
                <SelectItem value="unisex" className="font-body">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="rounded-full px-8 font-body text-sm">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
