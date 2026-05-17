'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireCurrentUser } from '@/lib/queries';

const optStr = z.string().optional().or(z.literal('')).transform((v) => (v ? String(v) : ''));

const TaskCreate = z.object({
  project_id: z.string().uuid(),
  title: z.string().min(2),
  description: z.string().optional(),
  assigned_to: optStr,
  reviewer_id: optStr,
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  deadline: optStr,
});

export async function createTask(formData: FormData) {
  const { profile } = await requireCurrentUser();
  const raw = Object.fromEntries(formData.entries());
  const parsed = TaskCreate.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || 'Invalid input' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      project_id: parsed.data.project_id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      assigned_to: parsed.data.assigned_to || null,
      reviewer_id: parsed.data.reviewer_id || null,
      priority: parsed.data.priority ?? 'normal',
      deadline: parsed.data.deadline ? new Date(parsed.data.deadline).toISOString() : null,
      created_by: profile.id,
      status: 'todo',
    })
    .select('id, title')
    .single();

  if (error) return { error: error.message };

  await supabase.from('activity_log').insert({
    entity_type: 'task',
    entity_id: data!.id,
    actor_id: profile.id,
    action: `created task "${parsed.data.title}"`,
  });

  if (parsed.data.assigned_to && parsed.data.assigned_to !== profile.id) {
    await supabase.from('notifications').insert({
      user_id: parsed.data.assigned_to,
      actor_id: profile.id,
      type: 'task_assigned',
      title: `Assigned: ${parsed.data.title}`,
      body: 'You have a new task.',
      link: `/app/tasks/${data!.id}`,
      task_id: data!.id,
    });
  }

  revalidatePath('/app/tasks');
  revalidatePath(`/app/projects/${parsed.data.project_id}`);
  redirect(`/app/tasks/${data!.id}`);
}

const TaskUpdate = z.object({
  title: z.string().min(2).optional(),
  description: optStr,
  assigned_to: optStr,
  reviewer_id: optStr,
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  deadline: optStr,
});

export async function updateTask(id: string, formData: FormData) {
  const { profile } = await requireCurrentUser();
  const raw = Object.fromEntries(formData.entries());
  const parsed = TaskUpdate.safeParse(raw);
  if (!parsed.success) return { error: 'Invalid input' };

  const supabase = await createClient();
  const { error } = await supabase
    .from('tasks')
    .update({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      assigned_to: parsed.data.assigned_to || null,
      reviewer_id: parsed.data.reviewer_id || null,
      priority: parsed.data.priority,
      deadline: parsed.data.deadline ? new Date(parsed.data.deadline).toISOString() : null,
    })
    .eq('id', id);
  if (error) return { error: error.message };

  await supabase.from('activity_log').insert({
    entity_type: 'task',
    entity_id: id,
    actor_id: profile.id,
    action: 'updated task',
  });

  revalidatePath(`/app/tasks/${id}`);
  revalidatePath('/app/tasks');
  return { ok: true };
}

export async function assignTask(taskId: string, userId: string) {
  const { profile } = await requireCurrentUser();
  const supabase = await createClient();
  const { data: task } = await supabase.from('tasks').select('*').eq('id', taskId).maybeSingle();
  if (!task) return { error: 'Task not found' };

  const { error } = await supabase
    .from('tasks')
    .update({ assigned_to: userId })
    .eq('id', taskId);
  if (error) return { error: error.message };

  await supabase.from('activity_log').insert({
    entity_type: 'task',
    entity_id: taskId,
    actor_id: profile.id,
    action: 'assigned the task',
  });

  if (userId !== profile.id) {
    await supabase.from('notifications').insert({
      user_id: userId,
      actor_id: profile.id,
      type: 'task_assigned',
      title: `Assigned: ${task.title}`,
      body: 'You have a new task.',
      link: `/app/tasks/${taskId}`,
      task_id: taskId,
    });
  }

  revalidatePath(`/app/tasks/${taskId}`);
  revalidatePath('/app/tasks');
  return { ok: true };
}

export async function moveTaskStatus(id: string, status: string) {
  const { profile } = await requireCurrentUser();
  const supabase = await createClient();
  const { data: task } = await supabase.from('tasks').select('*').eq('id', id).maybeSingle();
  if (!task) return { error: 'Task not found' };

  if (status === 'done' && task.reviewer_id) {
    return {
      error:
        'This task has a reviewer. Submit for approval instead of marking done directly.',
    };
  }

  const completedAt = status === 'done' ? new Date().toISOString() : null;
  const { error } = await supabase
    .from('tasks')
    .update({ status, completed_at: completedAt })
    .eq('id', id);
  if (error) return { error: error.message };

  await supabase.from('activity_log').insert({
    entity_type: 'task',
    entity_id: id,
    actor_id: profile.id,
    action: `moved task to ${status}`,
  });

  revalidatePath(`/app/tasks/${id}`);
  revalidatePath('/app/tasks');
  revalidatePath(`/app/projects/${task.project_id}`);
  return { ok: true };
}

export async function submitForReview(taskId: string) {
  const { profile } = await requireCurrentUser();
  const supabase = await createClient();
  const { data: task } = await supabase.from('tasks').select('*').eq('id', taskId).maybeSingle();
  if (!task) return { error: 'Task not found' };
  if (!task.reviewer_id) return { error: 'No reviewer set. Add a reviewer first.' };

  await supabase.from('approvals').insert({
    task_id: taskId,
    requested_by: profile.id,
    reviewer_id: task.reviewer_id,
    status: 'pending',
  });

  await supabase
    .from('tasks')
    .update({ status: 'review_pending' })
    .eq('id', taskId);

  await supabase.from('activity_log').insert({
    entity_type: 'task',
    entity_id: taskId,
    actor_id: profile.id,
    action: 'submitted task for review',
  });

  await supabase.from('notifications').insert({
    user_id: task.reviewer_id,
    actor_id: profile.id,
    type: 'task_review_requested',
    title: `Review requested: ${task.title}`,
    body: 'A task is waiting for your approval.',
    link: `/app/tasks/${taskId}`,
    task_id: taskId,
  });

  revalidatePath(`/app/tasks/${taskId}`);
  revalidatePath('/app/approvals');
  revalidatePath('/app/tasks');
  return { ok: true };
}

export async function decideApproval(
  approvalId: string,
  decision: 'approved' | 'rejected',
  note?: string
) {
  const { profile } = await requireCurrentUser();
  const supabase = await createClient();

  const { data: approval, error: aErr } = await supabase
    .from('approvals')
    .select('*')
    .eq('id', approvalId)
    .maybeSingle();
  if (aErr || !approval) return { error: aErr?.message || 'Approval not found' };

  const { error: updErr } = await supabase
    .from('approvals')
    .update({
      status: decision,
      decided_at: new Date().toISOString(),
      decision_note: note ?? null,
    })
    .eq('id', approvalId);
  if (updErr) return { error: updErr.message };

  const newStatus = decision === 'approved' ? 'done' : 'rejected';
  const { error: tErr } = await supabase
    .from('tasks')
    .update({
      status: newStatus,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null,
    })
    .eq('id', approval.task_id);
  if (tErr) return { error: tErr.message };

  await supabase.from('activity_log').insert({
    entity_type: 'task',
    entity_id: approval.task_id,
    actor_id: profile.id,
    action: `${decision} task${note ? `: ${note}` : ''}`,
  });

  if (approval.requested_by && approval.requested_by !== profile.id) {
    await supabase.from('notifications').insert({
      user_id: approval.requested_by,
      actor_id: profile.id,
      type: decision === 'approved' ? 'task_approved' : 'task_rejected',
      title: decision === 'approved' ? 'Task approved' : 'Task rejected',
      body: note ?? null,
      link: `/app/tasks/${approval.task_id}`,
      task_id: approval.task_id,
    });
  }

  revalidatePath('/app/approvals');
  revalidatePath(`/app/tasks/${approval.task_id}`);
  revalidatePath('/app/tasks');
  return { ok: true };
}

const CommentSchema = z.object({
  task_id: z.string().uuid(),
  body: z.string().min(1).max(5000),
});

export async function addComment(formData: FormData) {
  const { profile } = await requireCurrentUser();
  const parsed = CommentSchema.safeParse({
    task_id: formData.get('task_id'),
    body: formData.get('body'),
  });
  if (!parsed.success) return { error: 'Comment cannot be empty' };

  const mentionNames = Array.from(parsed.data.body.matchAll(/@([\w.-]+)/g)).map((m) => m[1]);
  const supabase = await createClient();

  let mentions: string[] = [];
  if (mentionNames.length) {
    const { data: matches } = await supabase
      .from('users')
      .select('id, full_name, email');
    mentions = (matches ?? [])
      .filter((u) =>
        mentionNames.some(
          (n) =>
            u.full_name?.toLowerCase().split(/\s+/).join('.').startsWith(n.toLowerCase()) ||
            u.email?.toLowerCase().startsWith(n.toLowerCase() + '@')
        )
      )
      .map((u) => u.id);
  }

  const { error } = await supabase.from('task_comments').insert({
    task_id: parsed.data.task_id,
    user_id: profile.id,
    body: parsed.data.body,
    mentions,
  });
  if (error) return { error: error.message };

  if (mentions.length) {
    const { data: task } = await supabase
      .from('tasks')
      .select('title')
      .eq('id', parsed.data.task_id)
      .maybeSingle();
    await supabase.from('notifications').insert(
      mentions
        .filter((m) => m !== profile.id)
        .map((uid) => ({
          user_id: uid,
          actor_id: profile.id,
          type: 'task_mentioned' as const,
          title: `Mentioned by ${profile.full_name || profile.email}`,
          body: task?.title ?? null,
          link: `/app/tasks/${parsed.data.task_id}`,
          task_id: parsed.data.task_id,
        }))
    );
  }

  revalidatePath(`/app/tasks/${parsed.data.task_id}`);
  return { ok: true };
}
