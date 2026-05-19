import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/shell/page-header';
import { Card, CardContent } from '@/components/ui/card';
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
import { PixelPet } from './pixel-pet';
import { HabitsManager } from '../habits/habits-manager';
import { createClient } from '@/lib/supabase/server';
import {
  getAllUsers,
  getClients,
  getDivisions,
  getProjects,
  getTasks,
  requireCurrentUser,
} from '@/lib/queries';
import type { Habit, HabitCompletion } from '@/lib/supabase/types';

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; project?: string }>;
}) {
  const { filter, project } = await searchParams;
  const { profile } = await requireCurrentUser();

  const [users, projects, clients, divisions, all] = await Promise.all([
    getAllUsers(),
    getProjects(),
    getClients(),
    getDivisions(),
    getTasks({ projectId: project }),
  ]);

  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const userMap = new Map(users.map((u) => [u.id, u]));
  const reportsByManager = new Map<string, string[]>();
  for (const user of users) {
    if (!user.manager_id) continue;
    const reportList = reportsByManager.get(user.manager_id) ?? [];
    reportList.push(user.id);
    reportsByManager.set(user.manager_id, reportList);
  }
  const visibleAssigneeIds = new Set<string>([profile.id]);
  const queue = [profile.id];
  while (queue.length) {
    const managerId = queue.shift()!;
    for (const reportId of reportsByManager.get(managerId) ?? []) {
      if (visibleAssigneeIds.has(reportId)) continue;
      visibleAssigneeIds.add(reportId);
      queue.push(reportId);
    }
  }

  let tasks = all.filter((task) => task.assigned_to && visibleAssigneeIds.has(task.assigned_to));
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
    { label: 'My team', key: '' },
    { label: 'Mine', key: 'mine' },
    { label: 'Awaiting my review', key: 'review' },
    { label: 'Overdue', key: 'overdue' },
  ];

  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const [{ data: hs }, { data: comps }] = await Promise.all([
    supabase
      .from('habits')
      .select('*')
      .eq('user_id', profile.id)
      .eq('is_active', true)
      .order('sort_index'),
    supabase
      .from('habit_completions')
      .select('*')
      .eq('user_id', profile.id)
      .eq('completed_on', today),
  ]);
  const habits = (hs ?? []) as Habit[];
  const habitDoneToday = ((comps ?? []) as HabitCompletion[]).map((c) => c.habit_id);

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
              <TaskForm
                projects={projects}
                clients={clients}
                users={users}
                divisions={divisions}
                projectTasks={all}
              />
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

      <div className="p-6 pt-2 space-y-4">
        <Card>
          <CardContent>
            <div className="mb-3">
              <div className="text-sm font-semibold">Personal habits</div>
              <div className="text-[12px] text-[var(--color-fg-dim)]">
                Personal-only recurring work. These stay yours and reset fresh each day.
              </div>
            </div>
            <HabitsManager habits={habits} doneToday={habitDoneToday} />
          </CardContent>
        </Card>

        <Card>
          {tasks.length === 0 ? (
            <PixelPet />
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
