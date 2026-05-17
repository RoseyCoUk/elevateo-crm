'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireCurrentUser } from '@/lib/queries';

export async function markRead(id: string) {
  const supabase = await createClient();
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id);
  revalidatePath('/app/inbox');
  revalidatePath('/app', 'layout');
}

export async function markAllRead() {
  const { profile } = await requireCurrentUser();
  const supabase = await createClient();
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', profile.id)
    .is('read_at', null);
  revalidatePath('/app/inbox');
  revalidatePath('/app', 'layout');
}
