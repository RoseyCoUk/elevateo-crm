import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Mail, Phone, Plus, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/shell/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { UserPill } from '@/components/shared/user-pill';
import { ClientForm } from '../client-form';
import { ProjectForm } from '../../projects/project-form';
import {
  getAllUsers,
  getClient,
  getDivisions,
  getProjects,
} from '@/lib/queries';
import {
  clientStatusTone,
  divisionTone,
  projectStatusLabel,
  projectStatusTone,
} from '@/lib/formatters';
import { formatDate } from '@/lib/utils';

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [client, divisions, users] = await Promise.all([
    getClient(id),
    getDivisions(),
    getAllUsers(),
  ]);
  if (!client) notFound();

  const projects = await getProjects({ clientId: client.id });
  const userMap = new Map(users.map((u) => [u.id, u]));
  const divMap = new Map(divisions.map((d) => [d.id, d]));

  const div = client.primary_division_id ? divMap.get(client.primary_division_id) : null;
  const lead = client.account_lead_id ? userMap.get(client.account_lead_id) : null;

  return (
    <div>
      <PageHeader
        title={client.name}
        meta={
          <>
            <Badge tone={clientStatusTone[client.status]} className="capitalize">
              {client.status}
            </Badge>
            {div ? <Badge tone={divisionTone[div.code] as any}>{div.name}</Badge> : null}
            {lead ? <UserPill user={lead} size="xs" /> : null}
          </>
        }
        actions={
          <>
            <Button asChild variant="ghost" size="sm">
              <Link href="/app/clients">
                <ArrowLeft className="h-3.5 w-3.5" /> Clients
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
                  <DialogTitle>Edit client</DialogTitle>
                </DialogHeader>
                <ClientForm divisions={divisions} users={users} existing={client} />
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-3.5 w-3.5" /> New project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New project for {client.name}</DialogTitle>
                </DialogHeader>
                <ProjectForm
                  clients={[client]}
                  divisions={divisions}
                  users={users}
                  defaultClientId={client.id}
                />
              </DialogContent>
            </Dialog>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 p-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Projects</CardTitle>
          </CardHeader>
          {projects.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-[var(--color-fg-dim)]">
              No projects yet for this client.
            </div>
          ) : (
            projects.map((p) => (
              <Link
                key={p.id}
                href={`/app/projects/${p.id}`}
                className="block px-4 py-3 border-b border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition"
              >
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="text-sm font-medium truncate">{p.title}</div>
                  <Badge tone={projectStatusTone[p.status]}>{projectStatusLabel[p.status]}</Badge>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[var(--color-fg-dim)]">
                  {p.due_date ? <span>Due {formatDate(p.due_date)}</span> : <span>No deadline</span>}
                  {p.lead_id ? (
                    <>
                      <span>·</span>
                      <UserPill user={userMap.get(p.lead_id) ?? null} size="xs" />
                    </>
                  ) : null}
                </div>
              </Link>
            ))
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-dim)] mb-1">
                Name
              </div>
              <div className="text-sm">{client.contact_name || '—'}</div>
            </div>
            {client.contact_email ? (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-dim)] mb-1">
                  Email
                </div>
                <a
                  href={`mailto:${client.contact_email}`}
                  className="text-sm inline-flex items-center gap-1.5 text-[var(--color-accent)] hover:underline"
                >
                  <Mail className="h-3 w-3" /> {client.contact_email}
                </a>
              </div>
            ) : null}
            {client.contact_phone ? (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-dim)] mb-1">
                  Phone
                </div>
                <div className="text-sm inline-flex items-center gap-1.5">
                  <Phone className="h-3 w-3" /> {client.contact_phone}
                </div>
              </div>
            ) : null}
            {client.notes ? (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-dim)] mb-1">
                  Notes
                </div>
                <div className="text-sm whitespace-pre-wrap text-[var(--color-fg-muted)]">
                  {client.notes}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
