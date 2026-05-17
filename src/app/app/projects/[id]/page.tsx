import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import { PageHeader } from '@/components/shell/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserPill } from '@/components/shared/user-pill';
import { TaskBoard } from '../../tasks/task-board';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TaskForm } from '../../tasks/task-form';
import { ProjectForm } from '../project-form';
import {
  getAllUsers,
  getClients,
  getClient,
  getDivisions,
  getProject,
  getTasks,
} from '@/lib/queries';
import {
  divisionTone,
  projectStatusLabel,
  projectStatusTone,
} from '@/lib/formatters';
import { formatDate } from '@/lib/utils';

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [tasks, users, divisions, clients, client] = await Promise.all([
    getTasks({ projectId: id }),
    getAllUsers(),
    getDivisions(),
    getClients(),
    project.client_id ? getClient(project.client_id) : Promise.resolve(null),
  ]);

  const userMap = new Map(users.map((u) => [u.id, u]));
  const div = project.division_id ? divisions.find((d) => d.id === project.division_id) : null;
  const lead = project.lead_id ? userMap.get(project.lead_id) : null;

  return (
    <div>
      <PageHeader
        title={project.title}
        description={project.description ?? undefined}
        meta={
          <>
            <Badge tone={projectStatusTone[project.status]}>
              {projectStatusLabel[project.status]}
            </Badge>
            {div ? <Badge tone={divisionTone[div.code] as any}>{div.name}</Badge> : null}
            {client ? (
              <Link href={`/app/clients/${client.id}`} className="text-xs text-[var(--color-fg-muted)] hover:underline">
                {client.name}
              </Link>
            ) : (
              <span className="text-xs text-[var(--color-fg-dim)]">Internal</span>
            )}
            {lead ? <UserPill user={lead} size="xs" /> : null}
            {project.due_date ? (
              <span className="text-xs text-[var(--color-fg-muted)]">Due {formatDate(project.due_date)}</span>
            ) : null}
          </>
        }
        actions={
          <>
            <Button asChild variant="ghost" size="sm">
              <Link href="/app/projects">
                <ArrowLeft className="h-3.5 w-3.5" /> Projects
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
                  <DialogTitle>Edit project</DialogTitle>
                </DialogHeader>
                <ProjectForm
                  clients={clients}
                  divisions={divisions}
                  users={users}
                  existing={project}
                />
              </DialogContent>
            </Dialog>
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
                  projectId={project.id}
                  projects={[project]}
                  users={users}
                />
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <div className="p-6">
        <TaskBoard tasks={tasks} users={users} />
      </div>
    </div>
  );
}
