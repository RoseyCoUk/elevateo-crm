'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/utils';
import { requireCurrentUser } from '@/lib/queries';

const ClientCreate = z.object({
  name: z.string().min(2),
  status: z.enum(['prospect', 'active', 'paused', 'archived']).optional(),
  primary_division_id: z.string().uuid().optional().or(z.literal('')),
  account_lead_id: z.string().uuid().optional().or(z.literal('')),
  contact_name: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  notes: z.string().optional(),
  member_ids: z.array(z.string().uuid()).optional(),
});

function parseClientPayload(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  return ClientCreate.safeParse({
    ...raw,
    member_ids: formData.getAll('member_ids'),
  });
}

export async function createClientRecord(formData: FormData) {
  const { profile } = await requireCurrentUser();
  const parsed = parseClientPayload(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid input' };
  }

  const supabase = await createClient();
  const slug = `${slugify(parsed.data.name)}-${Math.random().toString(36).slice(2, 6)}`;
  const { data, error } = await supabase
    .from('clients')
    .insert({
      name: parsed.data.name,
      slug,
      status: parsed.data.status ?? 'prospect',
      primary_division_id: parsed.data.primary_division_id || null,
      account_lead_id: parsed.data.account_lead_id || null,
      contact_name: parsed.data.contact_name || null,
      contact_email: parsed.data.contact_email || null,
      contact_phone: parsed.data.contact_phone || null,
      notes: parsed.data.notes || null,
      created_by: profile.id,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };

  const memberIds = Array.from(new Set((parsed.data.member_ids ?? []).filter((id) => id !== parsed.data.account_lead_id)));
  if (memberIds.length) {
    const { error: memberError } = await supabase.from('client_members').insert(
      memberIds.map((user_id) => ({
        client_id: data!.id,
        user_id,
      })),
    );
    if (memberError) return { error: memberError.message };
  }

  await supabase.from('activity_log').insert({
    entity_type: 'client',
    entity_id: data!.id,
    actor_id: profile.id,
    action: `created client ${parsed.data.name}`,
  });

  revalidatePath('/app/clients');
  redirect(`/app/clients/${data!.id}`);
}

export async function deleteClient(id: string) {
  const { profile } = await requireCurrentUser();
  const supabase = await createClient();

  const { data: client } = await supabase
    .from('clients')
    .select('name')
    .eq('id', id)
    .maybeSingle();

  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) return { error: error.message };

  await supabase.from('activity_log').insert({
    entity_type: 'client',
    entity_id: id,
    actor_id: profile.id,
    action: `deleted client${client?.name ? ` ${client.name}` : ''}`,
  });

  revalidatePath('/app/clients');
  redirect('/app/clients');
}

const ClientUpdate = ClientCreate.partial();

function parseClientUpdatePayload(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  return ClientUpdate.safeParse({
    ...raw,
    member_ids: formData.getAll('member_ids'),
  });
}

export async function updateClient(id: string, formData: FormData) {
  const { profile } = await requireCurrentUser();
  const parsed = parseClientUpdatePayload(formData);
  if (!parsed.success) return { error: 'Invalid input' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('clients')
    .update({
      name: parsed.data.name,
      status: parsed.data.status,
      primary_division_id: parsed.data.primary_division_id || null,
      account_lead_id: parsed.data.account_lead_id || null,
      contact_name: parsed.data.contact_name || null,
      contact_email: parsed.data.contact_email || null,
      contact_phone: parsed.data.contact_phone || null,
      notes: parsed.data.notes || null,
    })
    .eq('id', id);

  if (error) return { error: error.message };

  const memberIds = Array.from(new Set((parsed.data.member_ids ?? []).filter((memberId) => memberId !== parsed.data.account_lead_id)));
  const { error: deleteMembersError } = await supabase
    .from('client_members')
    .delete()
    .eq('client_id', id);
  if (deleteMembersError) return { error: deleteMembersError.message };
  if (memberIds.length) {
    const { error: memberError } = await supabase.from('client_members').insert(
      memberIds.map((user_id) => ({
        client_id: id,
        user_id,
      })),
    );
    if (memberError) return { error: memberError.message };
  }

  await supabase.from('activity_log').insert({
    entity_type: 'client',
    entity_id: id,
    actor_id: profile.id,
    action: 'updated client',
  });

  revalidatePath(`/app/clients/${id}`);
  revalidatePath('/app/clients');
  return { ok: true };
}
