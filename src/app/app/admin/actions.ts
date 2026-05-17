'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireCurrentUser } from '@/lib/queries';

const UserPatch = z.object({
  full_name: z.string().min(1).optional(),
  role: z.enum(['owner', 'executive', 'lead', 'member', 'reservist']).optional(),
  division_id: z.string().uuid().optional().or(z.literal('')),
  manager_id: z.string().uuid().optional().or(z.literal('')),
  is_active: z.string().optional(), // checkbox sends "on"
});

export async function updateUserAdmin(id: string, formData: FormData) {
  const { profile } = await requireCurrentUser();
  const raw = Object.fromEntries(formData.entries());
  const parsed = UserPatch.safeParse(raw);
  if (!parsed.success) return { error: 'Invalid input' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('users')
    .update({
      full_name: parsed.data.full_name,
      role: parsed.data.role,
      division_id: parsed.data.division_id || null,
      manager_id: parsed.data.manager_id || null,
      is_active: parsed.data.is_active === 'on' || parsed.data.is_active === 'true',
    })
    .eq('id', id);
  if (error) return { error: error.message };

  await supabase.from('activity_log').insert({
    entity_type: 'user',
    entity_id: id,
    actor_id: profile.id,
    action: 'updated user',
  });

  revalidatePath('/app/admin/people');
  revalidatePath('/app/people');
  return { ok: true };
}

export async function updateDivisionOwner(id: string, ownerId: string | null) {
  const supabase = await createClient();
  const { error } = await supabase.from('divisions').update({ owner_id: ownerId }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/app/admin/divisions');
  return { ok: true };
}
