import { createClient } from '@/lib/supabase/server';
import type {
  Approval,
  Client,
  Division,
  Notification,
  Project,
  Task,
  TaskComment,
  User,
} from './supabase/types';

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  return { authUser, profile: profile as User | null };
}

export async function requireCurrentUser() {
  const u = await getCurrentUser();
  if (!u?.profile) throw new Error('Not authenticated');
  return u as { authUser: { id: string; email?: string }; profile: User };
}

export async function getDivisions(): Promise<Division[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('divisions').select('*').order('name');
  return (data ?? []) as Division[];
}

export async function getAllUsers(): Promise<User[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('users').select('*').order('full_name');
  return (data ?? []) as User[];
}

export async function getClients(): Promise<Client[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('clients')
    .select('*')
    .order('updated_at', { ascending: false });
  return (data ?? []) as Client[];
}

export async function getClient(id: string): Promise<Client | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('clients').select('*').eq('id', id).maybeSingle();
  return (data as Client) ?? null;
}

export async function getProjects(opts?: {
  divisionId?: string;
  clientId?: string;
}): Promise<Project[]> {
  const supabase = await createClient();
  let q = supabase.from('projects').select('*').order('updated_at', { ascending: false });
  if (opts?.divisionId) q = q.eq('division_id', opts.divisionId);
  if (opts?.clientId) q = q.eq('client_id', opts.clientId);
  const { data } = await q;
  return (data ?? []) as Project[];
}

export async function getProject(id: string): Promise<Project | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('projects').select('*').eq('id', id).maybeSingle();
  return (data as Project) ?? null;
}

export async function getTasks(opts?: {
  projectId?: string;
  assignedTo?: string;
  reviewerId?: string;
  status?: string;
}): Promise<Task[]> {
  const supabase = await createClient();
  let q = supabase.from('tasks').select('*').order('position').order('created_at');
  if (opts?.projectId) q = q.eq('project_id', opts.projectId);
  if (opts?.assignedTo) q = q.eq('assigned_to', opts.assignedTo);
  if (opts?.reviewerId) q = q.eq('reviewer_id', opts.reviewerId);
  if (opts?.status) q = q.eq('status', opts.status);
  const { data } = await q;
  return (data ?? []) as Task[];
}

export async function getTask(id: string): Promise<Task | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('tasks').select('*').eq('id', id).maybeSingle();
  return (data as Task) ?? null;
}

export async function getTaskComments(taskId: string): Promise<TaskComment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('task_comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at');
  return (data ?? []) as TaskComment[];
}

export async function getPendingApprovalsForUser(userId: string): Promise<Approval[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('approvals')
    .select('*')
    .eq('reviewer_id', userId)
    .eq('status', 'pending')
    .order('created_at');
  return (data ?? []) as Approval[];
}

export async function getNotifications(userId: string, limit = 25): Promise<Notification[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as Notification[];
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null);
  return count ?? 0;
}
