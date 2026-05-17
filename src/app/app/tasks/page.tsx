import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/shell/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TaskRow } from '@/components/shared/task-row';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TaskForm } from './task-form';
import {
  getAllUsers,
  getProjects,
  getTasks,
  requireCurrentUser,
} from '@/lib/queries';

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; project?: string }>;
}) {
  const { filter, project } = await searchParams;
  const { profile } = await requireCurrentUser();

  const [users, projects, all] = await Promise.all([
    getAllUsers(),
    getProjects(),
    getTasks({ projectId: project }),
  ]);

  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const userMap = new Map(users.map((u) => [u.id, u]));

  let tasks = all;
  if (filter === 'mine') tasks = tasks.filter((t) => t.assigned_to === profile.id);
  if (filter === 'overdue')
    tasks = tasks.filter(
      (t) => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'done'
    );
  if (filter === 'review')
    tasks = tasks.filter(
      (t) => t.status === 'review_pending' && t.reviewer_id === profile.id
    );

  const filters: { label: string; key: string }[] = [
    { label: 'All', key: '' },
    { label: 'Mine', key: 'mine' },
    { label: 'Awaiting my review', key: 'review' },
    { label: 'Overdue', key: 'overdue' },
  ];

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Operational queue. Every task has an assignee; reviewers gate completion."
        actions={
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-3.5 w-3.5" /> New task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New task</DialogTitle>
              </DialogHeader>
              <TaskForm projects={projects} users={users} />
            </DialogContent>
          </Dialog>
        }
      />
      <div className="px-6 pt-4 pb-2 flex items-center gap-1.5">
        {filters.map((f) => {
          const active = (filter ?? '') === f.key;
          return (
            <Link
              key={f.key}
              href={f.key ? `/app/tasks?filter=${f.key}` : '/app/tasks'}
              className={`text-xs px-2.5 py-1 rounded-md border ${
                active
                  ? 'bg-[var(--color-surface-3)] border-[var(--color-border-strong)]'
                  : 'border-[var(--color-border)] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)]'
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <div className="p-6 pt-2">
        <Card>
          {tasks.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-[var(--color-fg-dim)]">
              No tasks match.
            </div>
          ) : (
            tasks.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                users={userMap}
                showProject={projectMap.get(t.project_id)?.title}
              />
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
