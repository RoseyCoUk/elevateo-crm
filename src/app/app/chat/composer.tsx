'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { initials } from '@/lib/utils';
import { PresenceDot } from '@/components/shared/presence-dot';
import { sendMessage } from './actions';
import type { User } from '@/lib/supabase/types';

function userHandle(u: { full_name: string; email: string }) {
  const slug = (u.full_name ?? '').toLowerCase().split(/\s+/).filter(Boolean).join('.');
  if (slug) return slug;
  return u.email.split('@')[0]?.toLowerCase() ?? '';
}

export function Composer({ roomId, users }: { roomId: string; users: User[] }) {
  const [body, setBody] = useState('');
  const [pending, setPending] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const candidates = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    const matches = users
      .filter((u) => u.is_active)
      .filter((u) => {
        if (!q) return true;
        const handle = userHandle(u);
        return (
          handle.startsWith(q) ||
          handle.includes('.' + q) ||
          u.full_name.toLowerCase().includes(q) ||
          u.email.toLowerCase().startsWith(q)
        );
      });
    return matches.slice(0, 7);
  }, [mentionQuery, users]);

  useEffect(() => {
    setMentionIndex(0);
  }, [mentionQuery]);

  function detectMention(value: string, caret: number) {
    // Find the @ that starts the current token before the caret, if any.
    let i = caret - 1;
    while (i >= 0) {
      const c = value[i];
      if (c === '@') {
        // Make sure @ is at start of string or after whitespace.
        const prev = i > 0 ? value[i - 1] : ' ';
        if (/\s/.test(prev) || i === 0) {
          const slice = value.slice(i + 1, caret);
          if (/^[\w.-]*$/.test(slice)) {
            setMentionQuery(slice);
            return;
          }
        }
        setMentionQuery(null);
        return;
      }
      if (/\s/.test(c)) break;
      i--;
    }
    setMentionQuery(null);
  }

  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setBody(e.target.value);
    detectMention(e.target.value, e.target.selectionStart);
  }

  function onSelect(e: React.SyntheticEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget;
    detectMention(el.value, el.selectionStart);
  }

  function insertMention(u: User) {
    const el = taRef.current;
    if (!el) return;
    const caret = el.selectionStart;
    // Find the @ token start.
    let i = caret - 1;
    while (i >= 0 && body[i] !== '@') i--;
    if (i < 0) return;
    const before = body.slice(0, i);
    const after = body.slice(caret);
    const handle = userHandle(u);
    const inserted = `@${handle} `;
    const next = before + inserted + after;
    setBody(next);
    setMentionQuery(null);
    requestAnimationFrame(() => {
      const pos = (before + inserted).length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mentionQuery !== null && candidates.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((i) => (i + 1) % candidates.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((i) => (i - 1 + candidates.length) % candidates.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(candidates[mentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionQuery(null);
        return;
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const trimmed = body.trim();
    if (!trimmed) return;
    const fd = new FormData();
    fd.set('room_id', roomId);
    fd.set('body', trimmed);
    setPending(true);
    sendMessage(fd)
      .then((r) => {
        if (r?.error) toast.error(r.error);
        else setBody('');
      })
      .finally(() => setPending(false));
  }

  return (
    <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] p-3 relative">
      {mentionQuery !== null && candidates.length > 0 ? (
        <div className="absolute bottom-full left-3 right-3 mb-2 max-h-[260px] overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg z-10">
          {candidates.map((u, i) => {
            const handle = userHandle(u);
            const name = u.full_name || u.email;
            return (
              <button
                key={u.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(u);
                }}
                className={
                  'flex w-full items-center gap-2 px-3 py-1.5 text-left transition ' +
                  (i === mentionIndex
                    ? 'bg-[var(--color-surface-3)]'
                    : 'hover:bg-[var(--color-surface-2)]')
                }
              >
                <span className="relative inline-flex">
                  <Avatar className="h-5 w-5">
                    {u.avatar_url ? <AvatarImage src={u.avatar_url} alt={name} /> : null}
                    <AvatarFallback>{initials(name)}</AvatarFallback>
                  </Avatar>
                  <PresenceDot user={u} size={7} />
                </span>
                <span className="text-[13px] text-[var(--color-fg)] truncate flex-1">{name}</span>
                <span className="text-[11px] text-[var(--color-fg-dim)]">@{handle}</span>
              </button>
            );
          })}
        </div>
      ) : null}
      <div className="flex items-end gap-2">
        <Textarea
          ref={taRef}
          rows={2}
          value={body}
          onChange={onChange}
          onSelect={onSelect}
          onKeyDown={onKeyDown}
          placeholder="Type a message. Use @ to mention someone. Enter to send, Shift+Enter for a new line."
          className="resize-none flex-1"
        />
        <Button onClick={submit} disabled={pending || !body.trim()}>
          <Send className="h-3.5 w-3.5" />
          {pending ? 'Sending' : 'Send'}
        </Button>
      </div>
    </div>
  );
}
