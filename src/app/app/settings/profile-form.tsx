'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateProfile } from './actions';
import type { User } from '@/lib/supabase/types';

export function ProfileForm({ profile }: { profile: User }) {
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    try {
      const r = await updateProfile(formData);
      if (r?.error) toast.error(r.error);
      else toast.success('Saved');
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" name="full_name" defaultValue={profile.full_name} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="avatar_url">Avatar URL</Label>
        <Input id="avatar_url" name="avatar_url" defaultValue={profile.avatar_url ?? ''} />
      </div>
      <Button disabled={pending}>{pending ? 'Saving...' : 'Save'}</Button>
    </form>
  );
}
