import { createClient } from '@/lib/supabase/server';
import type {
  Approval,
  Client,
  ClientMember,
  Division,
  Notification,
  Project,
  ProjectMember,
  Task,
  TaskComment,
  User,
} from './supabase/types';

const TASK_ARCHIVE_AGE_MS = 14 * 24 * 60 * 60 * 1000;

function isArchivedTask(task: Task): boolean {
  if (task.status !== 'done') return false;
  const reference = task.completed_at ?? task.updated_at ?? task.created_at;
  const timestamp = new Date(reference).getTime();
  if (Number.isNaN(timestamp)) return false;
  return Date.now() - timestamp > TASK_ARCHIVE_AGE_MS;
}

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

export async function getClientMembers(clientId: string): Promise<ClientMember[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('client_members')
    .select('*')
    .eq('client_id', clientId);
  return (data ?? []) as ClientMember[];
}

export async function getProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('project_members')
    .select('*')
    .eq('project_id', projectId);
  return (data ?? []) as ProjectMember[];
}

export async function getAllClientMembers(): Promise<ClientMember[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('client_members').select('*');
  return (data ?? []) as ClientMember[];
}

export async function getAllProjectMembers(): Promise<ProjectMember[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('project_members').select('*');
  return (data ?? []) as ProjectMember[];
}

export async function getTasks(opts?: {
  projectId?: string;
  assignedTo?: string;
  reviewerId?: string;
  status?: string;
  includeArchived?: boolean;
}): Promise<Task[]> {
  const supabase = await createClient();
  let q = supabase.from('tasks').select('*').order('position').order('created_at');
  if (opts?.projectId) q = q.eq('project_id', opts.projectId);
  if (opts?.assignedTo) q = q.eq('assigned_to', opts.assignedTo);
  if (opts?.reviewerId) q = q.eq('reviewer_id', opts.reviewerId);
  if (opts?.status) q = q.eq('status', opts.status);
  const { data } = await q;
  const tasks = (data ?? []) as Task[];
  return opts?.includeArchived ? tasks : tasks.filter((task) => !isArchivedTask(task));
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

/**
 * Returns per-room unread message counts for the given user across every chat
 * room they have access to. A message counts as unread if it was authored by
 * someone else and created after the user's last_read_at for that room (or
 * the room hasn't been opened yet — treated as last_read = epoch).
 */
export async function getChatUnreadByRoom(
  userId: string,
): Promise<{ total: number; byRoom: Record<string, number> }> {
  const supabase = await createClient();

  // Rooms visible to the user are gated by RLS on chat_rooms; the select itself
  // is enough — we don't need to filter manually.
  const [{ data: rooms }, { data: reads }] = await Promise.all([
    supabase.from('chat_rooms').select('id'),
    supabase.from('chat_read_state').select('room_id, last_read_at').eq('user_id', userId),
  ]);

  const roomIds = ((rooms ?? []) as Array<{ id: string }>).map((r) => r.id);
  if (roomIds.length === 0) return { total: 0, byRoom: {} };

  const readMap = new Map<string, string>(
    ((reads ?? []) as Array<{ room_id: string; last_read_at: string }>).map((r) => [
      r.room_id,
      r.last_read_at,
    ]),
  );

  // One query covering all visible rooms — much cheaper than per-room counts.
  // We compute unread client-side per room from a list of (room_id, created_at).
  const { data: msgs } = await supabase
    .from('chat_messages')
    .select('room_id, author_id, created_at')
    .in('room_id', roomIds)
    .neq('author_id', userId)
    .limit(2000);

  const byRoom: Record<string, number> = {};
  for (const m of (msgs ?? []) as Array<{
    room_id: string;
    author_id: string;
    created_at: string;
  }>) {
    const since = readMap.get(m.room_id);
    if (!since || m.created_at > since) {
      byRoom[m.room_id] = (byRoom[m.room_id] ?? 0) + 1;
    }
  }
  const total = Object.values(byRoom).reduce((a, b) => a + b, 0);
  return { total, byRoom };
}

export async function getLatestUnreadType(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('notifications')
    .select('type, created_at')
    .eq('user_id', userId)
    .is('read_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as { type: string } | null)?.type ?? null;
}
