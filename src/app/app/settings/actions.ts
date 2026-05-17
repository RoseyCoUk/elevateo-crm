'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireCurrentUser } from '@/lib/queries';

const Patch = z.object({
  full_name: z.string().min(1).max(120),
  avatar_url: z.string().url().optional().or(z.literal('')),
});

export async function updateProfile(formData: FormData) {
  const { profile } = await requireCurrentUser();
  const parsed = Patch.safeParse({
    full_name: formData.get('full_name'),
    avatar_url: formData.get('avatar_url') ?? '',
  });
  if (!parsed.success) return { error: 'Invalid input' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('users')
    .update({
      full_name: parsed.data.full_name,
      avatar_url: parsed.data.avatar_url || null,
    })
    .eq('id', profile.id);

  if (error) return { error: error.message };
  revalidatePath('/app', 'layout');
  return { ok: true };
}
