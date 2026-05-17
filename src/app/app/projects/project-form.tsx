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
import { createProject, updateProject } from './actions';
import type { Client, Division, Project, User } from '@/lib/supabase/types';

export function ProjectForm({
  clients,
  divisions,
  users,
  defaultClientId,
  existing,
}: {
  clients: Client[];
  divisions: Division[];
  users: User[];
  defaultClientId?: string;
  existing?: Project;
}) {
  const [pending, setPending] = useState(false);
  const [client, setClient] = useState<string>(existing?.client_id ?? defaultClientId ?? '');
  const [division, setDivision] = useState<string>(existing?.division_id ?? '');
  const [lead, setLead] = useState<string>(existing?.lead_id ?? '');
  const [status, setStatus] = useState<string>(existing?.status ?? 'planning');

  async function onSubmit(formData: FormData) {
    if (client) formData.set('client_id', client);
    if (division) formData.set('division_id', division);
    if (lead) formData.set('lead_id', lead);
    formData.set('status', status);
    setPending(true);
    try {
      const res = existing
        ? await updateProject(existing.id, formData)
        : await createProject(formData);
      if (res && 'error' in res && res.error) {
        toast.error(res.error);
      } else if (existing) {
        toast.success('Project saved');
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="title">Project title</Label>
        <Input id="title" name="title" defaultValue={existing?.title} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={existing?.description ?? ''} rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Client</Label>
          <Select value={client} onValueChange={setClient}>
            <SelectTrigger>
              <SelectValue placeholder="Internal" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Division</Label>
          <Select value={division} onValueChange={setDivision}>
            <SelectTrigger>
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              {divisions.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Lead</Label>
          <Select value={lead} onValueChange={setLead}>
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
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['planning', 'active', 'review', 'on_hold', 'completed', 'cancelled'].map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="start_date">Start</Label>
          <Input
            id="start_date"
            name="start_date"
            type="date"
            defaultValue={existing?.start_date ?? ''}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="due_date">Due</Label>
          <Input
            id="due_date"
            name="due_date"
            type="date"
            defaultValue={existing?.due_date ?? ''}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button disabled={pending}>{pending ? 'Saving...' : existing ? 'Save' : 'Create project'}</Button>
      </div>
    </form>
  );
}
