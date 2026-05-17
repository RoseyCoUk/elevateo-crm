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
import { createClientRecord, updateClient } from './actions';
import type { Client, Division, User } from '@/lib/supabase/types';

export function ClientForm({
  divisions,
  users,
  existing,
}: {
  divisions: Division[];
  users: User[];
  existing?: Client;
}) {
  const [pending, setPending] = useState(false);
  const [division, setDivision] = useState<string>(existing?.primary_division_id ?? '');
  const [lead, setLead] = useState<string>(existing?.account_lead_id ?? '');
  const [status, setStatus] = useState<string>(existing?.status ?? 'prospect');

  async function onSubmit(formData: FormData) {
    if (division) formData.set('primary_division_id', division);
    if (lead) formData.set('account_lead_id', lead);
    formData.set('status', status);
    setPending(true);
    try {
      const res = existing
        ? await updateClient(existing.id, formData)
        : await createClientRecord(formData);
      if (res && 'error' in res && res.error) {
        toast.error(res.error);
      } else if (existing) {
        toast.success('Client updated');
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="name">Client name</Label>
        <Input id="name" name="name" defaultValue={existing?.name} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['prospect', 'active', 'paused', 'archived'].map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Primary division</Label>
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
      <div className="space-y-1.5">
        <Label>Account lead</Label>
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
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="contact_name">Contact name</Label>
          <Input id="contact_name" name="contact_name" defaultValue={existing?.contact_name ?? ''} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact_email">Contact email</Label>
          <Input
            id="contact_email"
            name="contact_email"
            type="email"
            defaultValue={existing?.contact_email ?? ''}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contact_phone">Contact phone</Label>
        <Input id="contact_phone" name="contact_phone" defaultValue={existing?.contact_phone ?? ''} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={existing?.notes ?? ''} rows={3} />
      </div>
      <div className="flex justify-end">
        <Button disabled={pending}>{pending ? 'Saving...' : existing ? 'Save changes' : 'Create client'}</Button>
      </div>
    </form>
  );
}
