'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { decideApproval } from '../tasks/actions';

export function ApprovalActions({ approvalId }: { approvalId: string }) {
  const [pending, start] = useTransition();
  const [note, setNote] = useState('');
  const [open, setOpen] = useState<false | 'approved' | 'rejected'>(false);

  function commit(decision: 'approved' | 'rejected') {
    start(async () => {
      const r = await decideApproval(approvalId, decision, note || undefined);
      if (r?.error) toast.error(r.error);
      else {
        toast.success(decision === 'approved' ? 'Approved' : 'Rejected');
        setOpen(false);
        setNote('');
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Dialog open={open === 'approved'} onOpenChange={(o) => setOpen(o ? 'approved' : false)}>
        <DialogTrigger asChild>
          <Button size="sm" variant="secondary">
            <Check className="h-3.5 w-3.5" /> Approve
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve task</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Optional note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={pending} onClick={() => commit('approved')}>
              Confirm approve
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={open === 'rejected'} onOpenChange={(o) => setOpen(o ? 'rejected' : false)}>
        <DialogTrigger asChild>
          <Button size="sm" variant="danger">
            <X className="h-3.5 w-3.5" /> Reject
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject task</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Why is this rejected? (sent to the requester)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" disabled={pending} onClick={() => commit('rejected')}>
              Confirm reject
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
