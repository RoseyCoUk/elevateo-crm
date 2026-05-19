import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { PageHeader } from '@/components/shell/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserPill } from '@/components/shared/user-pill';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TaskForm } from '../task-form';
import { TaskActions } from './task-actions';
import { CommentList } from './comments';
import { DeleteEntityButton } from '@/components/shared/delete-entity-button';
import { deleteTask } from '../actions';
import { createClient } from '@/lib/supabase/server';
import {
  getAllUsers,
  getDivisions,
  getProject,
  getProjects,
  getTask,
  getTaskComments,
  requireCurrentUser,
} from '@/lib/queries';
import {
  approvalStatusTone,
  priorityTone,
  taskStatusLabel,
  taskStatusTone,
} from '@/lib/formatters';
import { formatDate, relativeTime } from '@/lib/utils';
import type { Approval, Task } from '@/lib/supabase/types';

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireCurrentUser();
  const task = await getTask(id);
  if (!task) notFound();

  const supabase = await createClient();
  const [project, users, comments, projects, divisions, siblingTasks, { data: approvals }, { data: activity }] =
    await Promise.all([
      getProject(task.project_id),
      getAllUsers(),
      getTaskComments(task.id),
      getProjects(),
      getDivisions(),
      supabase.from('tasks').select('*').eq('project_id', task.project_id).then((r) => r.data ?? []),
      supabase
        .from('approvals')
        .select('*')
        .eq('task_id', task.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('activity_log')
        .select('*')
        .eq('entity_type', 'task')
        .eq('entity_id', task.id)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

  const userMap = new Map(users.map((u) => [u.id, u]));
  const assignee = task.assigned_to ? userMap.get(task.assigned_to) : null;
  const reviewer = task.reviewer_id ? userMap.get(task.reviewer_id) : null;
  const isAssignee = task.assigned_to === profile.id;
  const isReviewer = task.reviewer_id === profile.id;
  const overdue =
    task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done';

  const approvalRows = (approvals ?? []) as Approval[];
  const openApproval = approvalRows.find((a) => a.status === 'pending') ?? null;
  const blocker = task.blocked_by
    ? (siblingTasks as Task[]).find((t) => t.id === task.blocked_by) ?? null
    : null;

  return (
    <div>
      <PageHeader
        title={task.title}
        meta={
          <>
            <Badge tone={taskStatusTone[task.status]}>{taskStatusLabel[task.status]}</Badge>
            <Badge tone={priorityTone[task.priority]} className="capitalize">
              {task.priority}
            </Badge>
            {project ? (
              <Link
                href={`/app/projects/${project.id}`}
                className="text-xs text-[var(--color-fg-muted)] hover:underline"
              >
                {project.title}
              </Link>
            ) : null}
            {task.deadline ? (
              <span className={`text-xs ${overdue ? 'text-red-300' : 'text-[var(--color-fg-muted)]'}`}>
                Due {formatDate(task.deadline, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            ) : null}
            {blocker ? (
              <Link
                href={`/app/tasks/${blocker.id}`}
                className="inline-flex items-center gap-1 text-xs"
              >
                <Badge tone={blocker.status === 'done' ? 'success' : 'warning'}>
                  Blocked by: {blocker.title}
                </Badge>
              </Link>
            ) : null}
          </>
        }
        actions={
          <>
            <Button asChild variant="ghost" size="sm">
              <Link href="/app/tasks">
                <ArrowLeft className="h-3.5 w-3.5" /> Tasks
              </Link>
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary" size="sm">
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit task</DialogTitle>
                </DialogHeader>
                <TaskForm
                  projects={projects}
                  users={users}
                  divisions={divisions}
                  existing={task}
                  projectTasks={siblingTasks as any}
                />
              </DialogContent>
            </Dialog>
            <DeleteEntityButton
              entityLabel="task"
              entityName={task.title}
              cascadeNote="All comments and approval records for this task will also be removed."
              action={async () => {
                'use server';
                return deleteTask(task.id);
              }}
            />
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 p-6">
        <div className="lg:col-span-2 space-y-3">
          {task.description ? (
            <Card>
              <CardHeader>
                <CardTitle>Brief</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap text-[var(--color-fg)]">
                  {task.description}
                </p>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>
                <span className="inline-flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Discussion
                </span>
              </CardTitle>
              <span className="text-[10px] font-mono text-[var(--color-fg-dim)]">
                {comments.length}
              </span>
            </CardHeader>
            <CommentList task={task} comments={comments} users={users} />
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(activity ?? []).length === 0 ? (
                <div className="text-xs text-[var(--color-fg-dim)]">No activity yet.</div>
              ) : (
                (activity ?? []).map((a) => {
                  const actor = a.actor_id ? userMap.get(a.actor_id) : null;
                  return (
                    <div key={a.id} className="text-xs">
                      <span className="text-[var(--color-fg)] font-medium">
                        {actor?.full_name ?? 'Someone'}
                      </span>{' '}
                      <span className="text-[var(--color-fg-muted)]">{a.action}</span>{' '}
                      <span className="text-[var(--color-fg-dim)]">· {relativeTime(a.created_at)}</span>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>People</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Field label="Assignee">
                <UserPill user={assignee ?? null} />
              </Field>
              <Field label="Reviewer (approver)">
                <UserPill user={reviewer ?? null} />
              </Field>
              <Field label="Created by">
                <UserPill
                  user={task.created_by ? userMap.get(task.created_by) ?? null : null}
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Approval flow</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskActions
                task={task}
                isAssignee={isAssignee}
                isReviewer={isReviewer}
                openApproval={openApproval}
                users={users}
              />
              {approvalRows.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {approvalRows.map((a) => (
                    <div
                      key={a.id}
                      className="text-xs border-t border-[var(--color-border)] pt-2 flex items-start justify-between gap-2"
                    >
                      <div>
                        <Badge tone={approvalStatusTone[a.status]} className="capitalize">
                          {a.status}
                        </Badge>
                        <div className="text-[var(--color-fg-muted)] mt-1">
                          Reviewer: {userMap.get(a.reviewer_id)?.full_name ?? '—'}
                        </div>
                        {a.decision_note ? (
                          <div className="text-[var(--color-fg)] mt-1">"{a.decision_note}"</div>
                        ) : null}
                      </div>
                      <div className="text-[10px] text-[var(--color-fg-dim)]">
                        {relativeTime(a.decided_at ?? a.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-dim)] mb-1">
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}
