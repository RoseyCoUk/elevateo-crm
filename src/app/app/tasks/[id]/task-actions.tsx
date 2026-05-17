'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Check, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { decideApproval, moveTaskStatus, submitForReview } from '../actions';
import type { Approval, Task } from '@/lib/supabase/types';
import { taskStatusLabel } from '@/lib/formatters';

export function TaskActions({
  task,
  isAssignee,
  isReviewer,
  openApproval,
}: {
  task: Task;
  isAssignee: boolean;
  isReviewer: boolean;
  openApproval: Approval | null;
}) {
  const [pending, start] = useTransition();
  const [note, setNote] = useState('');
  const [status, setStatus] = useState(task.status);

  const reviewerSet = !!task.reviewer_id;

  function call(p: Promise<{ error?: string; ok?: boolean }>) {
    start(async () => {
      const r = await p;
      if (r?.error) toast.error(r.error);
      else toast.success('Done');
    });
  }

  if (isReviewer && openApproval) {
    return (
      <div className="space-y-2">
        <div className="text-xs text-[var(--color-fg-muted)]">
          You are the reviewer. Decide below — the requester is waiting.
        </div>
        <Textarea
          placeholder="Optional note (visible to the requester)"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="flex gap-2">
          <Button
            className="flex-1"
            disabled={pending}
            onClick={() => call(decideApproval(openApproval.id, 'approved', note || undefined))}
          >
            <Check className="h-3.5 w-3.5" /> Approve
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            disabled={pending}
            onClick={() => call(decideApproval(openApproval.id, 'rejected', note || undefined))}
          >
            <X className="h-3.5 w-3.5" /> Reject
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-dim)] mb-1">
          Status
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as Task['status']);
            call(moveTaskStatus(task.id, v));
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(['todo', 'in_progress', 'blocked'] as const).map((s) => (
              <SelectItem key={s} value={s}>
                {taskStatusLabel[s]}
              </SelectItem>
            ))}
            {!reviewerSet ? (
              <SelectItem value="done">{taskStatusLabel.done}</SelectItem>
            ) : null}
          </SelectContent>
        </Select>
      </div>

      {reviewerSet && isAssignee && task.status !== 'done' && task.status !== 'review_pending' ? (
        <Button
          className="w-full"
          disabled={pending}
          onClick={() => call(submitForReview(task.id))}
        >
          <Send className="h-3.5 w-3.5" /> Submit for review
        </Button>
      ) : null}

      {task.status === 'review_pending' ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs px-3 py-2">
          Waiting on reviewer. They will approve or reject from their queue.
        </div>
      ) : null}

      {!reviewerSet ? (
        <div className="text-[11px] text-[var(--color-fg-dim)]">
          No reviewer assigned. Edit the task to add one — this enforces the approval gate.
        </div>
      ) : null}
    </div>
  );
}
