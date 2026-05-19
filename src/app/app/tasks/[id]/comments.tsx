'use client';

import { useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { addComment } from '../actions';
import { initials, relativeTime } from '@/lib/utils';
import { PresenceDot } from '@/components/shared/presence-dot';
import type { Task, TaskComment, User } from '@/lib/supabase/types';

export function CommentList({
  task,
  comments,
  users,
}: {
  task: Task;
  comments: TaskComment[];
  users: User[];
}) {
  const [pending, start] = useTransition();
  const userMap = new Map(users.map((u) => [u.id, u]));
  const formRef = useRef<HTMLFormElement>(null);
  const [value, setValue] = useState('');

  function onSubmit(formData: FormData) {
    if (!formData.get('body')) return;
    start(async () => {
      const r = await addComment(formData);
      if (r?.error) toast.error(r.error);
      else {
        setValue('');
        formRef.current?.reset();
      }
    });
  }

  return (
    <div>
      <div className="divide-y divide-[var(--color-border)]">
        {comments.length === 0 ? (
          <div className="px-4 py-6 text-xs text-[var(--color-fg-dim)] text-center">
            No comments yet. Use @name to mention someone.
          </div>
        ) : (
          comments.map((c) => {
            const author = c.user_id ? userMap.get(c.user_id) : null;
            return (
              <div key={c.id} className="px-4 py-3 flex gap-3">
                <span className="relative inline-flex flex-shrink-0">
                  <Avatar>
                    {author?.avatar_url ? (
                      <AvatarImage src={author.avatar_url} alt={author.full_name || author.email} />
                    ) : null}
                    <AvatarFallback>
                      {initials(author?.full_name || author?.email || '?')}
                    </AvatarFallback>
                  </Avatar>
                  {author ? <PresenceDot user={author} size={10} /> : null}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold">
                      {author?.full_name || author?.email || 'Someone'}
                    </span>
                    <span className="text-[10px] text-[var(--color-fg-dim)]">
                      {relativeTime(c.created_at)}
                    </span>
                  </div>
                  <div className="text-sm whitespace-pre-wrap mt-0.5">{c.body}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form ref={formRef} action={onSubmit} className="border-t border-[var(--color-border)] p-3 flex gap-2 items-end">
        <input type="hidden" name="task_id" value={task.id} />
        <Textarea
          name="body"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={2}
          placeholder="Write a comment. Use @name to mention."
          className="flex-1 resize-none"
        />
        <Button type="submit" disabled={pending || !value.trim()}>
          <Send className="h-3.5 w-3.5" /> Send
        </Button>
      </form>
    </div>
  );
}
