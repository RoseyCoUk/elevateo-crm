'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Megaphone, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createAnnouncement } from './actions';

export function AnnouncementForm() {
  const [pinned, setPinned] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    formData.set('pinned', pinned ? 'on' : 'off');
    startTransition(async () => {
      const r = await createAnnouncement(formData);
      if (r?.error) toast.error(r.error);
      else {
        toast.success('Announcement posted');
        const form = document.getElementById('announcement-form') as HTMLFormElement | null;
        form?.reset();
        setPinned(false);
      }
    });
  }

  return (
    <form id="announcement-form" action={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" placeholder="What's the announcement?" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="body">Body</Label>
        <Textarea
          id="body"
          name="body"
          rows={4}
          placeholder="Details for the team..."
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex items-center gap-2 text-[12px] text-[var(--color-fg-muted)] cursor-pointer">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
            className="h-3.5 w-3.5"
          />
          <Pin className="h-3.5 w-3.5" />
          Pin to Command Center
        </label>
        <div className="space-y-1.5">
          <Label htmlFor="expires_at" className="text-[11px]">
            Auto-hide after (optional)
          </Label>
          <Input id="expires_at" name="expires_at" type="datetime-local" />
        </div>
      </div>
      <div className="flex justify-end">
        <Button disabled={pending}>
          <Megaphone className="h-3.5 w-3.5" />
          {pending ? 'Posting...' : 'Post to everyone'}
        </Button>
      </div>
      <p className="text-[11px] text-[var(--color-fg-dim)]">
        Posting fans out a notification to every active team member's inbox.
      </p>
    </form>
  );
}
