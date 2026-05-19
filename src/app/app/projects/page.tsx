import Link from 'next/link';
import { Plus, GanttChartSquare } from 'lucide-react';
import { PageHeader } from '@/components/shell/page-header';
import { Card } from '@/components/ui/card';
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
import { ProjectForm } from './project-form';
import {
  getAllClientMembers,
  getAllProjectMembers,
  getAllUsers,
  getClients,
  getDivisions,
  getProjects,
  requireCurrentUser,
} from '@/lib/queries';
import { divisionTone, projectStatusLabel, projectStatusTone } from '@/lib/formatters';
import { formatDate } from '@/lib/utils';

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter = 'current' } = await searchParams;
  const { profile } = await requireCurrentUser();
  const [projects, clients, divisions, users, clientMembers, projectMembers] = await Promise.all([
    getProjects(),
    getClients(),
    getDivisions(),
    getAllUsers(),
    getAllClientMembers(),
    getAllProjectMembers(),
  ]);
  const userMap = new Map(users.map((u) => [u.id, u]));
  const clientMap = new Map(clients.map((c) => [c.id, c]));
  const divMap = new Map(divisions.map((d) => [d.id, d]));
  const filters: Array<{ label: string; key: string }> = [
    { label: 'Mine', key: 'mine' },
    { label: 'Current', key: 'current' },
    { label: 'All', key: 'all' },
  ];

  let visibleProjects = projects;
  if (filter === 'mine') {
    visibleProjects = projects.filter((project) => {
      const client = project.client_id ? clientMap.get(project.client_id) : null;
      return (
        project.lead_id === profile.id ||
        projectMembers.some((member) => member.project_id === project.id && member.user_id === profile.id) ||
        client?.account_lead_id === profile.id ||
        clientMembers.some((member) => member.client_id === project.client_id && member.user_id === profile.id)
      );
    });
  } else if (filter === 'current') {
    visibleProjects = projects.filter(
      (project) => project.status !== 'completed' && project.status !== 'cancelled',
    );
  }

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Every project carries client, division, lead, and deadline."
        actions={
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-3.5 w-3.5" /> New project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New project</DialogTitle>
              </DialogHeader>
              <ProjectForm clients={clients} divisions={divisions} users={users} />
            </DialogContent>
          </Dialog>
        }
      />

      <div className="px-6 pt-4 pb-2 flex items-center gap-1.5">
        {filters.map((item) => {
          const active = filter === item.key;
          return (
            <Link
              key={item.key}
              href={`/app/projects?filter=${item.key}`}
              className={`text-xs px-2.5 py-1 rounded-md border ${
                active
                  ? 'bg-[var(--color-surface-3)] border-[var(--color-border-strong)]'
                  : 'border-[var(--color-border)] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)]'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="p-6 pt-2">
        <Card>
          <div className="grid grid-cols-[1fr_140px_140px_140px_140px_110px] text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-dim)] px-4 py-2 border-b border-[var(--color-border)]">
            <div>Title</div>
            <div>Client</div>
            <div>Division</div>
            <div>Lead</div>
            <div>Status</div>
            <div className="text-right">Due</div>
          </div>
          {visibleProjects.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-[var(--color-fg-dim)]">
              No projects match this filter.
            </div>
          ) : (
            visibleProjects.map((p) => {
              const client = p.client_id ? clientMap.get(p.client_id) : null;
              const div = p.division_id ? divMap.get(p.division_id) : null;
              const lead = p.lead_id ? userMap.get(p.lead_id) : null;
              return (
                <Link
                  key={p.id}
                  href={`/app/projects/${p.id}`}
                  className="grid grid-cols-[1fr_140px_140px_140px_140px_110px] items-center px-4 py-3 border-b border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-7 w-7 rounded bg-[var(--color-surface-3)] flex items-center justify-center">
                      <GanttChartSquare className="h-3.5 w-3.5 text-[var(--color-fg-muted)]" />
                    </div>
                    <div className="text-sm font-medium truncate">{p.title}</div>
                  </div>
                  <div className="text-xs text-[var(--color-fg-muted)] truncate">
                    {client?.name ?? 'Internal'}
                  </div>
                  <div>
                    {div ? (
                      <Badge tone={divisionTone[div.code] as any}>{div.name}</Badge>
                    ) : (
                      <span className="text-[11px] text-[var(--color-fg-dim)]">—</span>
                    )}
                  </div>
                  <div>
                    <UserPill user={lead ?? null} size="xs" />
                  </div>
                  <div>
                    <Badge tone={projectStatusTone[p.status]}>{projectStatusLabel[p.status]}</Badge>
                  </div>
                  <div className="text-right text-[11px] text-[var(--color-fg-dim)]">
                    {p.due_date ? formatDate(p.due_date) : '—'}
                  </div>
                </Link>
              );
            })
          )}
        </Card>
      </div>
    </div>
  );
}
