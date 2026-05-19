'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createTask, updateTask } from './actions';
import type { Client, Division, Project, Task, User } from '@/lib/supabase/types';

const NO_CLIENT = '__none__';
const UNASSIGNED = '__unassigned__';

export function TaskForm({
  projectId,
  projects,
  clients,
  users,
  divisions,
  existing,
  projectTasks,
}: {
  projectId?: string;
  projects: Project[];
  clients?: Client[];
  users: User[];
  divisions: Division[];
  existing?: Task;
  /** Existing tasks in the same project, for the "Depends on" picker. */
  projectTasks?: Task[];
}) {
  const [pending, setPending] = useState(false);

  const preselectedProject = existing?.project_id ?? projectId ?? '';
  const preselectedClient = useMemo(() => {
    if (!preselectedProject) return '';
    const project = projects.find((item) => item.id === preselectedProject);
    return project?.client_id ?? NO_CLIENT;
  }, [preselectedProject, projects]);

  const [client, setClient] = useState<string>(preselectedClient);
  const [proj, setProj] = useState<string>(preselectedProject);
  const [assignee, setAssignee] = useState<string>(existing?.assigned_to ?? UNASSIGNED);
  const [reviewer, setReviewer] = useState<string>(existing?.reviewer_id ?? '');
  const [priority, setPriority] = useState<string>(existing?.priority ?? 'normal');
  const [blockedBy, setBlockedBy] = useState<string>(existing?.blocked_by ?? '');

  const dependencyOptions = useMemo(() => {
    if (!projectTasks?.length || !proj) return [];
    return projectTasks
      .filter((t) => t.project_id === proj && t.id !== existing?.id)
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [projectTasks, proj, existing?.id]);

  const divisionMap = useMemo(() => new Map(divisions.map((d) => [d.id, d.code])), [divisions]);

  const filteredProjects = useMemo(() => {
    if (!clients) return projects;
    if (!client) return [];
    if (client === NO_CLIENT) return projects.filter((project) => !project.client_id);
    return projects.filter((project) => project.client_id === client);
  }, [projects, clients, client]);

  const reviewerOptions = useMemo(() => {
    const selectedProject = projects.find((project) => project.id === proj);
    const divisionCode = selectedProject?.division_id
      ? divisionMap.get(selectedProject.division_id) ?? null
      : null;
    const roleWeight: Record<User['role'], number> = {
      owner: 0,
      executive: 1,
      lead: 2,
      member: 3,
      reservist: 4,
      external: 5,
    };

    return users
      .filter((user) => {
        if (!user.is_active) return false;
        if (!['owner', 'executive', 'lead'].includes(user.role)) return false;
        if (!selectedProject?.division_id) return true;
        if (user.division_id === selectedProject.division_id) return true;
        return !!divisionCode && Array.isArray(user.divisions) && user.divisions.includes(divisionCode);
      })
      .sort((a, b) => {
        const roleDiff = roleWeight[a.role] - roleWeight[b.role];
        if (roleDiff !== 0) return roleDiff;
        return (a.full_name || a.email).localeCompare(b.full_name || b.email);
      });
  }, [divisionMap, proj, projects, users]);

  if (proj && filteredProjects.length && !filteredProjects.find((project) => project.id === proj)) {
    setProj('');
  }

  async function onSubmit(formData: FormData) {
    if (!existing) {
      if (!proj) {
        toast.error('Pick a project');
        return;
      }
      formData.set('project_id', proj);
    }
    if (assignee && assignee !== UNASSIGNED) formData.set('assigned_to', assignee);
    if (reviewer) formData.set('reviewer_id', reviewer);
    formData.set('blocked_by', blockedBy);
    formData.set('priority', priority);
    setPending(true);
    try {
      const result = existing ? await updateTask(existing.id, formData) : await createTask(formData);
      if (result && 'error' in result && result.error) toast.error(result.error);
      else if (existing) toast.success('Task saved');
    } finally {
      setPending(false);
    }
  }

  const lockProjectPicker = !!existing || !!projectId;

  return (
    <form action={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="title">Task title</Label>
        <Input id="title" name="title" defaultValue={existing?.title} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={existing?.description ?? ''}
          rows={3}
        />
      </div>

      {!lockProjectPicker && clients ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Client</Label>
            <Select
              value={client}
              onValueChange={(value) => {
                setClient(value);
                setProj('');
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pick client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CLIENT}>Internal (no client)</SelectItem>
                {clients.map((clientOption) => (
                  <SelectItem key={clientOption.id} value={clientOption.id}>
                    {clientOption.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Project</Label>
            <Select value={proj} onValueChange={setProj} disabled={!client}>
              <SelectTrigger>
                <SelectValue placeholder={client ? 'Pick project' : 'Pick a client first'} />
              </SelectTrigger>
              <SelectContent>
                {filteredProjects.length === 0 ? (
                  <div className="px-3 py-2 text-[12px] text-[var(--color-fg-dim)]">
                    No projects for this client
                  </div>
                ) : (
                  filteredProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : !lockProjectPicker ? (
        <div className="space-y-1.5">
          <Label>Project</Label>
          <Select value={proj} onValueChange={setProj}>
            <SelectTrigger>
              <SelectValue placeholder="Pick project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label>Reviewer · the manager who owns the outcome</Label>
        <Select value={reviewer} onValueChange={setReviewer}>
          <SelectTrigger>
            <SelectValue
              placeholder={
                proj
                  ? 'Pick a division lead / executive reviewer'
                  : 'Pick a project first to see the right reviewers'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {reviewerOptions.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {(user.full_name || user.email) + ' · ' + user.role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[11px] text-[var(--color-fg-dim)]">
          Reviewer options stay scoped to the highest people in the selected division.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>Assignee · optional, reviewer can choose later</Label>
        <Select value={assignee} onValueChange={setAssignee}>
          <SelectTrigger>
            <SelectValue placeholder="Leave for reviewer to assign" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED}>Leave for reviewer to assign</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.full_name || user.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['low', 'normal', 'high', 'urgent'].map((value) => (
                <SelectItem key={value} value={value} className="capitalize">
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deadline">Deadline</Label>
          <Input
            id="deadline"
            name="deadline"
            type="datetime-local"
            defaultValue={existing?.deadline ? existing.deadline.slice(0, 16) : ''}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Depends on · optional</Label>
        <Select
          value={blockedBy || '__none__'}
          onValueChange={(v) => setBlockedBy(v === '__none__' ? '' : v)}
          disabled={!proj || dependencyOptions.length === 0}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                !proj
                  ? 'Pick a project first'
                  : dependencyOptions.length === 0
                  ? 'No other tasks in this project yet'
                  : 'No dependency'
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">No dependency</SelectItem>
            {dependencyOptions.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[11px] text-[var(--color-fg-dim)]">
          Blocks this task from moving past "To do" until the chosen task is done.
        </p>
      </div>

      <div className="flex justify-end">
        <Button disabled={pending}>{pending ? 'Saving...' : existing ? 'Save' : 'Create task'}</Button>
      </div>
    </form>
  );
}
