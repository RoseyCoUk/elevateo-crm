'use client';

import { useState } from 'react';
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
import type { Project, Task, User } from '@/lib/supabase/types';

export function TaskForm({
  projectId,
  projects,
  users,
  existing,
}: {
  projectId?: string;
  projects: Project[];
  users: User[];
  existing?: Task;
}) {
  const [pending, setPending] = useState(false);
  const [proj, setProj] = useState<string>(existing?.project_id ?? projectId ?? '');
  const [assignee, setAssignee] = useState<string>(existing?.assigned_to ?? '');
  const [reviewer, setReviewer] = useState<string>(existing?.reviewer_id ?? '');
  const [priority, setPriority] = useState<string>(existing?.priority ?? 'normal');

  async function onSubmit(formData: FormData) {
    if (!existing) {
      if (!proj) {
        toast.error('Pick a project');
        return;
      }
      formData.set('project_id', proj);
    }
    if (assignee) formData.set('assigned_to', assignee);
    if (reviewer) formData.set('reviewer_id', reviewer);
    formData.set('priority', priority);
    setPending(true);
    try {
      const res = existing
        ? await updateTask(existing.id, formData)
        : await createTask(formData);
      if (res && 'error' in res && res.error) toast.error(res.error);
      else if (existing) toast.success('Task saved');
    } finally {
      setPending(false);
    }
  }

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
      {!existing ? (
        <div className="space-y-1.5">
          <Label>Project</Label>
          <Select value={proj} onValueChange={setProj}>
            <SelectTrigger>
              <SelectValue placeholder="Pick project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Assignee</Label>
          <Select value={assignee} onValueChange={setAssignee}>
            <SelectTrigger>
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.full_name || u.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Reviewer (approver)</Label>
          <Select value={reviewer} onValueChange={setReviewer}>
            <SelectTrigger>
              <SelectValue placeholder="No review required" />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.full_name || u.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['low', 'normal', 'high', 'urgent'].map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
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
      <div className="flex justify-end">
        <Button disabled={pending}>
          {pending ? 'Saving...' : existing ? 'Save' : 'Create task'}
        </Button>
      </div>
    </form>
  );
}
