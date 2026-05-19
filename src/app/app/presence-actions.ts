'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/**
 * Bumps last_seen_at to now() for the current user. Called periodically by
 * the HeartbeatLoop client component while the tab is visible.
 */
export async function heartbeat() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { ok: false } as const;
  await supabase
    .from('users')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', userData.user.id);
  return { ok: true } as const;
}

export async function setPresenceStatus(status: 'online' | 'away' | 'dnd' | null) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: 'Not signed in' };
  await supabase
    .from('users')
    .update({
      presence_status: status,
      last_seen_at: new Date().toISOString(),
    })
    .eq('id', userData.user.id);
  revalidatePath('/app', 'layout');
  return { ok: true };
}
