import Link from 'next/link';
import {
  Activity,
  AlarmClock,
  ArrowRight,
  CalendarDays,
  CheckSquare,
  Megaphone,
  PhoneCall,
  Pin,
  ShieldCheck,
} from 'lucide-react';
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
import type { ActivityLogEntry, Announcement, Project, Task } from '@/lib/supabase/types';
import { relativeTime } from '@/lib/utils';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const GREETINGS = [
  (n: string) => `What's on the agenda today, ${n}? Where should we begin?`,
  (n: string) => `Good to see you, ${n}. What can you think of?`,
  (n: string) => `Back at it, ${n}. What's the one thing that moves the needle today?`,
  (n: string) => `Welcome back, ${n}. Pick your battle for the morning.`,
  (n: string) => `Morning, ${n}. Let's make today count.`,
  (n: string) => `Hey ${n} — what would make today a win?`,
  (n: string) => `${n}, the team's waiting. What's first?`,
  (n: string) => `Show up, ${n}. The work doesn't move itself.`,
  (n: string) => `One step at a time, ${n}. What's step one?`,
  (n: string) => `Big day or small day, ${n} — your call.`,
  (n: string) => `${n}, what's the move?`,
  (n: string) => `Let's get after it, ${n}.`,
  (n: string) => `${n} — focus beats hustle. What gets your focus today?`,
  (n: string) => `${n}, what would make this week look obvious in hindsight?`,
  (n: string) => `Steady, ${n}. Pick one thing and finish it.`,
];

export default async function CommandCenterPage() {
  const { profile } = await requireCurrentUser();
  const [myTasks, pendingApprovals, projects, users, divisions] = await Promise.all([
    getTasks({ assignedTo: profile.id }),
    getPendingApprovalsForUser(profile.id),
    getProjects(),
    getAllUsers(),
    getDivisions(),
  ]);

  const userMap = new Map(users.map((user) => [user.id, user]));
  const divMap = new Map(divisions.map((division) => [division.id, division]));
  const projectMap = new Map(projects.map((project) => [project.id, project]));

  const activeTasks = myTasks.filter((task) => task.status !== 'done');
  const overdue = activeTasks.filter(
    (task) => task.deadline && new Date(task.deadline).getTime() < Date.now()
  );

  const reviewQueueTaskIds = pendingApprovals.map((approval) => approval.task_id);
  const supabase = await createClient();
  const { data: reviewQueueTasks } = reviewQueueTaskIds.length
    ? await supabase.from('tasks').select('*').in('id', reviewQueueTaskIds)
    : { data: [] };

  const activeProjects = projects.filter(
    (project) => project.status === 'active' || project.status === 'review'
  );

  const { data: recentActivity } = await supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: announcementsRaw } = await supabase
    .from('announcements')
    .select('*')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(8);
  const nowIso = new Date().toISOString();
  const announcements = ((announcementsRaw ?? []) as Announcement[])
    .filter((a) => !a.expires_at || a.expires_at > nowIso)
    .slice(0, 3);

  const dueSoonProjects = activeProjects
    .filter((project) => project.due_date)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 4);

  const projectsByDivision = divisions
    .map((division) => ({
      division,
      count: activeProjects.filter((project) => project.division_id === division.id).length,
    }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count);

  const now = new Date();
  const dueCounts = new Map<number, number>();
  for (const task of activeTasks) {
    if (!task.deadline) continue;
    const dueDate = new Date(task.deadline);
    if (dueDate.getMonth() !== now.getMonth() || dueDate.getFullYear() !== now.getFullYear()) {
      continue;
    }
    dueCounts.set(dueDate.getDate(), (dueCounts.get(dueDate.getDate()) ?? 0) + 1);
  }
  for (const project of activeProjects) {
    if (!project.due_date) continue;
    const dueDate = new Date(project.due_date);
    if (dueDate.getMonth() !== now.getMonth() || dueDate.getFullYear() !== now.getFullYear()) {
      continue;
    }
    dueCounts.set(dueDate.getDate(), (dueCounts.get(dueDate.getDate()) ?? 0) + 1);
  }

  const coldCallGoal = profile.cold_call_goal ?? 40;
  const coldCallProgress = 0;
  const calendarDays = buildCalendarDays(now, dueCounts);

  return (
    <div className="min-h-full flex flex-col">
      <PageHeader
        title="Command Center"
        description={GREETINGS[Math.floor(Math.random() * GREETINGS.length)](
          profile.full_name.split(' ')[0] || 'Team',
        )}
      />

      {announcements.length > 0 ? (
        <div className="px-7 pt-5 space-y-2">
          {announcements.map((a) => {
            const author = a.author_id ? userMap.get(a.author_id) : null;
            return (
              <div
                key={a.id}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 flex items-start gap-3"
              >
                <div className="mt-0.5">
                  {a.pinned ? (
                    <Pin className="h-4 w-4 text-[var(--color-warning)]" />
                  ) : (
                    <Megaphone className="h-4 w-4 text-[var(--color-accent)]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-[var(--color-fg)] truncate">
                    {a.title}
                  </div>
                  <div className="text-[12px] text-[var(--color-fg-muted)] whitespace-pre-wrap mt-0.5">
                    {a.body}
                  </div>
                  <div className="text-[11px] text-[var(--color-fg-dim)] mt-1.5">
                    {author?.full_name ?? 'Admin'} · {relativeTime(a.created_at)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-7 pb-3">
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
        <ProjectStat count={activeProjects.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 px-7 pb-3">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>My tasks</CardTitle>
            <Link
              href="/app/tasks"
              className="text-[12px] text-[var(--color-fg-muted)] inline-flex items-center gap-1 hover:text-[var(--color-accent)]"
            >
              Open tasks <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <div>
            {activeTasks.length === 0 ? (
              <Empty message="No tasks assigned to you." />
            ) : (
              activeTasks.slice(0, 8).map((task) => {
                const project = projectMap.get(task.project_id);
                return (
                  <TaskRow
                    key={task.id}
                    task={task}
                    users={userMap}
                    showProject={project?.title}
                  />
                );
              })
            )}
          </div>
        </Card>

        <div className="space-y-3">
          <ColdCallerCard goal={coldCallGoal} progress={coldCallProgress} />
          <ProjectSnapshotCard
            activeProjects={activeProjects}
            dueSoonProjects={dueSoonProjects}
            projectsByDivision={projectsByDivision}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 px-7 pb-3">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Awaiting your approval</CardTitle>
            <Link
              href="/app/approvals"
              className="text-[12px] text-[var(--color-fg-muted)] inline-flex items-center gap-1 hover:text-[var(--color-accent)]"
            >
              All approvals <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <div>
            {((reviewQueueTasks ?? []) as Task[]).length === 0 ? (
              <Empty message="All clear - nothing waiting on your signoff." />
            ) : (
              ((reviewQueueTasks ?? []) as Task[]).map((task) => {
                const project = projectMap.get(task.project_id);
                return (
                  <TaskRow
                    key={task.id}
                    task={task}
                    users={userMap}
                    showProject={project?.title}
                  />
                );
              })
            )}
          </div>
        </Card>

        <CalendarCard days={calendarDays} />
      </div>

      <div className="px-7 pb-10">
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {((recentActivity ?? []) as ActivityLogEntry[]).length === 0 ? (
              <Empty message="No activity yet." inline />
            ) : (
              ((recentActivity ?? []) as ActivityLogEntry[]).map((entry) => {
                const actor = entry.actor_id ? userMap.get(entry.actor_id) : null;
                return (
                  <div key={entry.id} className="text-[12px] text-[var(--color-fg-muted)]">
                    <span className="text-[var(--color-fg)] font-medium">
                      {actor?.full_name ?? 'Someone'}
                    </span>{' '}
                    {entry.action}
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
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-[12px] font-medium text-[var(--color-fg-muted)]">{label}</div>
        <Icon
          className={`h-4 w-4 ${
            accent && value > 0
              ? 'text-[var(--color-accent)]'
              : tone === 'danger' && value > 0
                ? 'text-[var(--color-danger)]'
                : 'text-[var(--color-fg-dim)]'
          }`}
        />
      </div>
      <div
        className={`text-[28px] font-semibold tabular-nums tracking-tight ${
          tone === 'danger' && value > 0
            ? 'text-[var(--color-danger)]'
            : accent && value > 0
              ? 'text-[var(--color-accent)]'
              : ''
        }`}
      >
        {value}
      </div>
    </Link>
  );
}

function ProjectStat({ count }: { count: number }) {
  return (
    <Link
      href="/app/projects"
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-[12px] font-medium text-[var(--color-fg-muted)]">Portfolio load</div>
        <Activity className="h-4 w-4 text-[var(--color-fg-dim)]" />
      </div>
      <div className="text-[19px] font-semibold leading-tight text-[var(--color-fg)]">
        Currently managing {count} projects
      </div>
    </Link>
  );
}

function ColdCallerCard({ goal, progress }: { goal: number; progress: number }) {
  const percent = goal > 0 ? Math.min(100, Math.round((progress / goal) * 100)) : 0;

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Cold caller</CardTitle>
        <PhoneCall className="h-4 w-4 text-[var(--color-fg-dim)]" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="text-[20px] font-semibold">
            {progress} / {goal}
          </div>
          <div className="text-[12px] text-[var(--color-fg-muted)]">
            Today&apos;s cold calling progress vs goal
          </div>
        </div>
        <div className="h-2 rounded-full bg-[var(--color-surface-3)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--color-accent)] transition-[width]"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-[var(--color-fg-dim)]">
          <span>Placeholder until call data is connected.</span>
          <Link href="/app/settings" className="text-[var(--color-accent)] hover:underline">
            Set goal
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectSnapshotCard({
  activeProjects,
  dueSoonProjects,
  projectsByDivision,
}: {
  activeProjects: Project[];
  dueSoonProjects: Project[];
  projectsByDivision: Array<{
    division: { id: string; code: string; name: string };
    count: number;
  }>;
}) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Project snapshot</CardTitle>
        <Link href="/app/projects" className="text-[12px] text-[var(--color-fg-muted)] hover:text-[var(--color-accent)]">
          Open projects
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-[20px] font-semibold text-[var(--color-fg)]">
            Currently managing {activeProjects.length} projects
          </div>
          <div className="text-[12px] text-[var(--color-fg-muted)]">
            Breakdown first, due-soon pressure second.
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {projectsByDivision.length === 0 ? (
            <span className="text-[12px] text-[var(--color-fg-dim)]">No active projects yet.</span>
          ) : (
            projectsByDivision.slice(0, 5).map((entry) => (
              <Badge key={entry.division.id} tone={divisionTone[entry.division.code as keyof typeof divisionTone] as never}>
                {entry.division.name} - {entry.count}
              </Badge>
            ))
          )}
        </div>

        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-fg-dim)]">
            Due soon
          </div>
          {dueSoonProjects.length === 0 ? (
            <div className="text-[12px] text-[var(--color-fg-dim)]">No upcoming project due dates.</div>
          ) : (
            dueSoonProjects.map((project) => (
              <Link
                key={project.id}
                href={`/app/projects/${project.id}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 hover:bg-[var(--color-surface-3)]/60"
              >
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium">{project.title}</div>
                  <div className="text-[11px] text-[var(--color-fg-dim)]">
                    Due {formatShortDate(project.due_date)}
                  </div>
                </div>
                <Badge tone={projectStatusTone[project.status]}>
                  {projectStatusLabel[project.status]}
                </Badge>
              </Link>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CalendarCard({ days }: { days: CalendarDay[] }) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Calendar</CardTitle>
        <CalendarDays className="h-4 w-4 text-[var(--color-fg-dim)]" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-dim)]">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label}>{label}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => (
            <div
              key={`${day.dateKey}-${index}`}
              className={`min-h-[64px] rounded-xl border px-2 py-1.5 ${
                day.inMonth
                  ? 'border-[var(--color-border)] bg-[var(--color-surface)]'
                  : 'border-transparent bg-[var(--color-surface-2)]/60 text-[var(--color-fg-dim)]'
              } ${day.isToday ? 'ring-1 ring-[var(--color-accent)]' : ''}`}
            >
              <div className="text-[11px] font-medium">{day.day}</div>
              {day.dueCount > 0 ? (
                <div className="mt-2 inline-flex rounded-full bg-[var(--color-accent)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--color-accent)]">
                  {day.dueCount} due
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <div className="text-[11px] text-[var(--color-fg-dim)]">
          Counts reflect your active task deadlines and active project due dates this month.
        </div>
      </CardContent>
    </Card>
  );
}

function Empty({ message, inline }: { message: string; inline?: boolean }) {
  return (
    <div
      className={
        inline
          ? 'text-[12px] text-[var(--color-fg-dim)]'
          : 'px-5 py-10 text-[13px] text-[var(--color-fg-dim)] text-center'
      }
    >
      {message}
    </div>
  );
}

interface CalendarDay {
  dateKey: string;
  day: number;
  dueCount: number;
  inMonth: boolean;
  isToday: boolean;
}

function buildCalendarDays(now: Date, dueCounts: Map<number, number>): CalendarDay[] {
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const startDate = new Date(year, month, 1 - startOffset);
  const days: CalendarDay[] = [];

  for (let index = 0; index < 35; index += 1) {
    const current = new Date(startDate);
    current.setDate(startDate.getDate() + index);
    const inMonth = current.getMonth() === month;
    const isToday =
      current.getFullYear() === now.getFullYear() &&
      current.getMonth() === now.getMonth() &&
      current.getDate() === now.getDate();

    days.push({
      dateKey: current.toISOString(),
      day: current.getDate(),
      dueCount: inMonth ? dueCounts.get(current.getDate()) ?? 0 : 0,
      inMonth,
      isToday,
    });
  }

  return days;
}

function formatShortDate(value: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}
