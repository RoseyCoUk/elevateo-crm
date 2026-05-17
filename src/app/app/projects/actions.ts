'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireCurrentUser } from '@/lib/queries';

const opt = (s: z.ZodTypeAny) => s.optional().or(z.literal(''));

const ProjectCreate = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  client_id: opt(z.string().uuid()),
  division_id: opt(z.string().uuid()),
  lead_id: opt(z.string().uuid()),
  status: z
    .enum(['planning', 'active', 'review', 'on_hold', 'completed', 'cancelled'])
    .optional(),
  start_date: opt(z.string()),
  due_date: opt(z.string()),
});

export async function createProject(formData: FormData) {
  const { profile } = await requireCurrentUser();
  const raw = Object.fromEntries(formData.entries());
  const parsed = ProjectCreate.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || 'Invalid input' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('projects')
    .insert({
      title: parsed.data.title,
      description: parsed.data.description || null,
      client_id: parsed.data.client_id || null,
      division_id: parsed.data.division_id || null,
      lead_id: parsed.data.lead_id || null,
      status: parsed.data.status ?? 'planning',
      start_date: parsed.data.start_date || null,
      due_date: parsed.data.due_date || null,
      created_by: profile.id,
    })
    .select('id')
    .single();

  if (error) return { error: error.message };

  await supabase.from('activity_log').insert({
    entity_type: 'project',
    entity_id: data!.id,
    actor_id: profile.id,
    action: `created project ${parsed.data.title}`,
  });

  if (parsed.data.lead_id && parsed.data.lead_id !== profile.id) {
    await supabase.from('notifications').insert({
      user_id: parsed.data.lead_id,
      actor_id: profile.id,
      type: 'project_assigned',
      title: 'You lead a new project',
      body: parsed.data.title,
      link: `/app/projects/${data!.id}`,
      project_id: data!.id,
    });
  }

  revalidatePath('/app/projects');
  redirect(`/app/projects/${data!.id}`);
}

export async function updateProject(id: string, formData: FormData) {
  const { profile } = await requireCurrentUser();
  const raw = Object.fromEntries(formData.entries());
  const parsed = ProjectCreate.partial().safeParse(raw);
  if (!parsed.success) return { error: 'Invalid input' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('projects')
    .update({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      client_id: parsed.data.client_id || null,
      division_id: parsed.data.division_id || null,
      lead_id: parsed.data.lead_id || null,
      status: parsed.data.status,
      start_date: parsed.data.start_date || null,
      due_date: parsed.data.due_date || null,
    })
    .eq('id', id);
  if (error) return { error: error.message };

  await supabase.from('activity_log').insert({
    entity_type: 'project',
    entity_id: id,
    actor_id: profile.id,
    action: 'updated project',
  });

  revalidatePath(`/app/projects/${id}`);
  revalidatePath('/app/projects');
  return { ok: true };
}
