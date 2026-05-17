import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/shell/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserPill } from '@/components/shared/user-pill';
import { TaskRow } from '@/components/shared/task-row';
import { createClient } from '@/lib/supabase/server';
import {
  getAllUsers,
  getDivisions,
  getProjects,
} from '@/lib/queries';
import {
  divisionTone,
  projectStatusLabel,
  projectStatusTone,
} from '@/lib/formatters';
import { formatDate } from '@/lib/utils';
import type { DivisionCode, Task } from '@/lib/supabase/types';

export default async function DivisionPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const divisions = await getDivisions();
  const division = divisions.find((d) => d.code === code);
  if (!division) notFound();

  const supabase = await createClient();
  const [users, projects, { data: tasks }] = await Promise.all([
    getAllUsers(),
    getProjects({ divisionId: division.id }),
    supabase
      .from('tasks')
      .select('*')
      .in(
        'project_id',
        (await getProjects({ divisionId: division.id })).map((p) => p.id),
      ),
  ]);

  const divUsers = users.filter((u) => u.division_id === division.id);
  const userMap = new Map(users.map((u) => [u.id, u]));

  return (
    <div>
      <PageHeader
        title={division.name}
        description={division.description ?? undefined}
        meta={
          <>
            <Badge tone={divisionTone[division.code as DivisionCode] as any}>{division.name}</Badge>
            <span className="text-xs text-[var(--color-fg-muted)]">
              {divUsers.length} people · {projects.length} projects
            </span>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 p-6">
        <Card className="lg:col-span-2">
          <div className="px-4 py-2 border-b border-[var(--color-border)] flex items-center justify-between">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-dim)]">
              Open tasks
            </div>
            <span className="text-[10px] font-mono text-[var(--color-fg-dim)]">
              {(tasks ?? []).filter((t) => t.status !== 'done').length}
            </span>
          </div>
          {((tasks ?? []) as Task[])
            .filter((t) => t.status !== 'done')
            .slice(0, 25)
            .map((t) => (
              <TaskRow key={t.id} task={t} users={userMap} />
            ))}
          {(tasks ?? []).filter((t) => t.status !== 'done').length === 0 ? (
            <div className="px-4 py-10 text-center text-xs text-[var(--color-fg-dim)]">
              No open tasks for this division.
            </div>
          ) : null}
        </Card>

        <div className="space-y-3">
          <Card>
            <div className="px-4 py-2 border-b border-[var(--color-border)] text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-dim)]">
              Projects
            </div>
            {projects.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-[var(--color-fg-dim)]">
                No projects yet.
              </div>
            ) : (
              projects.slice(0, 8).map((p) => (
                <Link
                  key={p.id}
                  href={`/app/projects/${p.id}`}
                  className="block px-4 py-2.5 border-b border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="text-sm font-medium truncate">{p.title}</div>
                    <Badge tone={projectStatusTone[p.status]}>
                      {projectStatusLabel[p.status]}
                    </Badge>
                  </div>
                  {p.due_date ? (
                    <div className="text-[11px] text-[var(--color-fg-dim)]">
                      Due {formatDate(p.due_date)}
                    </div>
                  ) : null}
                </Link>
              ))
            )}
          </Card>

          <Card>
            <div className="px-4 py-2 border-b border-[var(--color-border)] text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-dim)]">
              People
            </div>
            <div className="p-3 space-y-2">
              {divUsers.length === 0 ? (
                <div className="text-xs text-[var(--color-fg-dim)]">No people assigned.</div>
              ) : (
                divUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between">
                    <UserPill user={u} size="sm" />
                    <Badge tone="default" className="capitalize">
                      {u.role}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
