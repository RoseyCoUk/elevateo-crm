import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/shell/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserPill } from '@/components/shared/user-pill';
import { ApprovalActions } from './approval-actions';
import { createClient } from '@/lib/supabase/server';
import {
  getAllUsers,
  getPendingApprovalsForUser,
  getProjects,
  requireCurrentUser,
} from '@/lib/queries';
import { priorityTone } from '@/lib/formatters';
import { formatDate, relativeTime } from '@/lib/utils';
import type { Task } from '@/lib/supabase/types';

export default async function ApprovalsPage() {
  const { profile } = await requireCurrentUser();
  const supabase = await createClient();

  const [approvals, users, projects] = await Promise.all([
    getPendingApprovalsForUser(profile.id),
    getAllUsers(),
    getProjects(),
  ]);
  const userMap = new Map(users.map((u) => [u.id, u]));
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const taskIds = approvals.map((a) => a.task_id);
  const { data: tasks } = taskIds.length
    ? await supabase.from('tasks').select('*').in('id', taskIds)
    : { data: [] };
  const taskMap = new Map(((tasks ?? []) as Task[]).map((t) => [t.id, t]));

  return (
    <div>
      <PageHeader
        title="Approvals"
        description="Tasks waiting on your signoff. No task is officially done until you approve."
        meta={
          <span className="inline-flex items-center gap-2 text-xs text-[var(--color-fg-muted)]">
            <ShieldCheck className="h-3.5 w-3.5" />
            {approvals.length} pending · for {profile.full_name}
          </span>
        }
      />

      <div className="p-6">
        <Card>
          {approvals.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <div className="text-2xl mb-2">✓</div>
              <div className="text-sm font-semibold mb-1">Inbox zero</div>
              <div className="text-xs text-[var(--color-fg-muted)]">
                Nothing waiting on you. Reviews land here when teammates submit work.
              </div>
            </div>
          ) : (
            approvals.map((a) => {
              const task = taskMap.get(a.task_id);
              if (!task) return null;
              const project = task.project_id ? projectMap.get(task.project_id) : null;
              const requester = a.requested_by ? userMap.get(a.requested_by) : null;
              return (
                <div
                  key={a.id}
                  className="px-4 py-3 border-b border-[var(--color-border)] grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-start"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/app/tasks/${task.id}`}
                        className="text-sm font-medium hover:underline truncate"
                      >
                        {task.title}
                      </Link>
                      <Badge tone={priorityTone[task.priority]} className="capitalize">
                        {task.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[var(--color-fg-muted)]">
                      {project ? (
                        <Link href={`/app/projects/${project.id}`} className="hover:underline">
                          {project.title}
                        </Link>
                      ) : null}
                      <span>·</span>
                      <span>submitted by</span>
                      <UserPill user={requester ?? null} size="xs" />
                      <span>· {relativeTime(a.created_at)}</span>
                      {task.deadline ? <span>· due {formatDate(task.deadline)}</span> : null}
                    </div>
                  </div>
                  <ApprovalActions approvalId={a.id} />
                </div>
              );
            })
          )}
        </Card>
      </div>
    </div>
  );
}
