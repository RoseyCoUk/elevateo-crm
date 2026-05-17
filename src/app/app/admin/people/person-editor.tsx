'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { updateUserAdmin } from '../actions';
import type { Division, User } from '@/lib/supabase/types';

export function PersonEditor({
  user,
  divisions,
  users,
}: {
  user: User;
  divisions: Division[];
  users: User[];
}) {
  const [pending, setPending] = useState(false);
  const [role, setRole] = useState(user.role);
  const [div, setDiv] = useState(user.division_id ?? '');
  const [manager, setManager] = useState(user.manager_id ?? '');
  const [active, setActive] = useState(user.is_active);
  const [open, setOpen] = useState(false);

  async function onSubmit(formData: FormData) {
    formData.set('role', role);
    formData.set('division_id', div);
    formData.set('manager_id', manager);
    formData.set('is_active', active ? 'on' : 'off');
    setPending(true);
    try {
      const r = await updateUserAdmin(user.id, formData);
      if (r?.error) toast.error(r.error);
      else {
        toast.success('Saved');
        setOpen(false);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user.full_name || user.email}</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Name</Label>
            <Input id="full_name" name="full_name" defaultValue={user.full_name} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as User['role'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['owner', 'executive', 'lead', 'member', 'reservist'] as const).map((r) => (
                    <SelectItem key={r} value={r} className="capitalize">
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Division</Label>
              <Select value={div} onValueChange={setDiv}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
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
            <Label>Reports to</Label>
            <Select value={manager} onValueChange={setManager}>
              <SelectTrigger>
                <SelectValue placeholder="No manager" />
              </SelectTrigger>
              <SelectContent>
                {users
                  .filter((u) => u.id !== user.id)
                  .map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name || u.email}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-3.5 w-3.5"
            />
            Active
          </label>
          <div className="flex justify-end">
            <Button disabled={pending}>{pending ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
