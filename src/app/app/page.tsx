import Link from 'next/link';
import { ArrowRight, CheckSquare, ShieldCheck, AlarmClock, Activity } from 'lucide-react';
import { PageHeader } from '@/components/shell/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TaskRow } from '@/components/shared/task-row';
import { createClient } from '@/lib/supabase/server';
import {
  getAllUsers,
  getDivisions,
  getPendingApprovalsForUser,
  getProjects,
  getTasks,
  requireCurrentUser,
} from '@/lib/queries';
import { divisionTone, projectStatusLabel, projectStatusTone } from '@/lib/formatters';

export default async function DashboardPage() {
  const { profile } = await requireCurrentUser();
  const [myTasks, pendingApprovals, projects, users, divisions] = await Promise.all([
    getTasks({ assignedTo: profile.id }),
    getPendingApprovalsForUser(profile.id),
    getProjects(),
    getAllUsers(),
    getDivisions(),
  ]);

  const userMap = new Map(users.map((u) => [u.id, u]));
  const divMap = new Map(divisions.map((d) => [d.id, d]));
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const activeTasks = myTasks.filter((t) => t.status !== 'done');
  const overdue = activeTasks.filter(
    (t) => t.deadline && new Date(t.deadline) < new Date()
  );
  const reviewQueueTaskIds = pendingApprovals.map((a) => a.task_id);
  const supabase = await createClient();
  const { data: reviewQueueTasks } = reviewQueueTaskIds.length
    ? await supabase.from('tasks').select('*').in('id', reviewQueueTaskIds)
    : { data: [] };

  const activeProjects = projects.filter((p) => p.status === 'active' || p.status === 'review');

  const { data: recentActivity } = await supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <div className="min-h-full flex flex-col">
      <PageHeader
        title={`Hey ${profile.full_name.split(' ')[0] || 'there'} —`}
        description="Your war room overview. Approvals first, then your queue, then the field."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-6 pb-3">
        <Stat
          icon={ShieldCheck}
          label="Pending approvals"
          value={pendingApprovals.length}
          href="/app/approvals"
          accent
        />
        <Stat
          icon={CheckSquare}
          label="My active tasks"
          value={activeTasks.length}
          href="/app/tasks"
        />
        <Stat
          icon={AlarmClock}
          label="Overdue"
          value={overdue.length}
          tone={overdue.length ? 'danger' : 'default'}
          href="/app/tasks?filter=overdue"
        />
        <Stat
          icon={Activity}
          label="Active projects"
          value={activeProjects.length}
          href="/app/projects"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 px-6 pb-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Awaiting your approval</CardTitle>
            <Link href="/app/approvals" className="text-[11px] text-[var(--color-fg-muted)] inline-flex items-center gap-1">
              All approvals <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <div>
            {(reviewQueueTasks ?? []).length === 0 ? (
              <Empty message="Inbox zero. Nothing waiting on your signoff." />
            ) : (
              (reviewQueueTasks ?? []).map((t) => {
                const project = projectMap.get(t.project_id);
                return (
                  <TaskRow
                    key={t.id}
                    task={t as any}
                    users={userMap}
                    showProject={project?.title}
                  />
                );
              })
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active projects</CardTitle>
          </CardHeader>
          <div>
            {activeProjects.length === 0 ? (
              <Empty message="No active projects yet." />
            ) : (
              activeProjects.slice(0, 6).map((p) => {
                const div = p.division_id ? divMap.get(p.division_id) : null;
                return (
                  <Link
                    key={p.id}
                    href={`/app/projects/${p.id}`}
                    className="block px-4 py-2.5 border-b border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="text-sm font-medium truncate">{p.title}</div>
                      <Badge tone={projectStatusTone[p.status]}>{projectStatusLabel[p.status]}</Badge>
                    </div>
                    {div ? (
                      <Badge tone={divisionTone[div.code] as any}>{div.name}</Badge>
                    ) : null}
                  </Link>
                );
              })
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 px-6 pb-10">
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>My tasks</CardTitle>
            <Link href="/app/tasks" className="text-[11px] text-[var(--color-fg-muted)] inline-flex items-center gap-1">
              Open tasks <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <div>
            {activeTasks.length === 0 ? (
              <Empty message="No tasks assigned to you." />
            ) : (
              activeTasks.slice(0, 8).map((t) => {
                const project = projectMap.get(t.project_id);
                return (
                  <TaskRow
                    key={t.id}
                    task={t}
                    users={userMap}
                    showProject={project?.title}
                  />
                );
              })
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(recentActivity ?? []).length === 0 ? (
              <Empty message="No activity yet." inline />
            ) : (
              (recentActivity ?? []).map((a) => {
                const actor = a.actor_id ? userMap.get(a.actor_id) : null;
                return (
                  <div key={a.id} className="text-xs text-[var(--color-fg-muted)]">
                    <span className="text-[var(--color-fg)] font-medium">
                      {actor?.full_name ?? 'Someone'}
                    </span>{' '}
                    {a.action}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  href,
  accent,
  tone,
}: {
  icon: typeof CheckSquare;
  label: string;
  value: number;
  href: string;
  accent?: boolean;
  tone?: 'danger' | 'default';
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 hover:bg-[var(--color-surface-2)] transition"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-dim)]">
          {label}
        </div>
        <Icon
          className={`h-3.5 w-3.5 ${
            accent ? 'text-[var(--color-accent)]' : tone === 'danger' && value > 0 ? 'text-red-300' : 'text-[var(--color-fg-dim)]'
          }`}
        />
      </div>
      <div
        className={`text-2xl font-bold tabular-nums ${
          tone === 'danger' && value > 0 ? 'text-red-300' : accent && value > 0 ? 'text-[var(--color-accent)]' : ''
        }`}
      >
        {value}
      </div>
    </Link>
  );
}

function Empty({ message, inline }: { message: string; inline?: boolean }) {
  return (
    <div className={inline ? 'text-xs text-[var(--color-fg-dim)]' : 'px-4 py-8 text-xs text-[var(--color-fg-dim)] text-center'}>
      {message}
    </div>
  );
}
