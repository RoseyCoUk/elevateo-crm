import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { UserPill } from './user-pill';
import { formatDate } from '@/lib/utils';
import { priorityTone, taskStatusLabel, taskStatusTone } from '@/lib/formatters';
import type { Task, User } from '@/lib/supabase/types';

export function TaskRow({
  task,
  users,
  showProject,
}: {
  task: Task;
  users: Map<string, User>;
  showProject?: string;
}) {
  const assignee = task.assigned_to ? users.get(task.assigned_to) : null;
  const reviewer = task.reviewer_id ? users.get(task.reviewer_id) : null;
  const overdue =
    task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done';

  return (
    <Link
      href={`/app/tasks/${task.id}`}
      className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition"
    >
      <Badge tone={taskStatusTone[task.status]}>{taskStatusLabel[task.status]}</Badge>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{task.title}</div>
        {showProject ? (
          <div className="text-[11px] text-[var(--color-fg-dim)] mt-0.5">{showProject}</div>
        ) : null}
      </div>
      <Badge tone={priorityTone[task.priority]} className="capitalize">
        {task.priority}
      </Badge>
      {task.deadline ? (
        <span
          className={`inline-flex items-center gap-1 text-[11px] ${
            overdue ? 'text-red-300' : 'text-[var(--color-fg-muted)]'
          }`}
        >
          <CalendarDays className="h-3 w-3" />
          {formatDate(task.deadline)}
        </span>
      ) : null}
      <UserPill user={assignee ?? null} size="xs" />
      {reviewer ? (
        <span className="text-[10px] text-[var(--color-fg-dim)] hidden md:inline">
          → reviews {reviewer.full_name.split(' ')[0]}
        </span>
      ) : null}
    </Link>
  );
}
