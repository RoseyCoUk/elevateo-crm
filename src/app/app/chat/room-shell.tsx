'use client';

import { useState } from 'react';
import { Users, X } from 'lucide-react';
import { UserPill } from '@/components/shared/user-pill';
import { MessageList } from './message-list';
import { Composer } from './composer';
import { effectiveStatus, statusLabel, statusColor } from '@/lib/presence';
import type { User } from '@/lib/supabase/types';

type Message = {
  id: string;
  room_id: string;
  author_id: string | null;
  body: string;
  pinned: boolean;
  created_at: string;
};

export function RoomShell({
  roomId,
  title,
  members,
  messages,
  currentUserId,
  allUsers,
}: {
  roomId: string;
  title: React.ReactNode;
  members: User[];
  messages: Message[];
  currentUserId: string;
  allUsers: User[];
}) {
  const [showPeople, setShowPeople] = useState(false);

  // Sort: online first, then away, then DND, then offline. Stable on name.
  const sortedMembers = [...members].sort((a, b) => {
    const order: Record<string, number> = { online: 0, away: 1, dnd: 2, offline: 3 };
    const sa = order[effectiveStatus(a)] ?? 4;
    const sb = order[effectiveStatus(b)] ?? 4;
    if (sa !== sb) return sa - sb;
    return (a.full_name || a.email).localeCompare(b.full_name || b.email);
  });

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5 text-[13px] font-semibold text-[var(--color-fg)]">
        <div className="min-w-0 flex-1">{title}</div>
        <button
          type="button"
          onClick={() => setShowPeople((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-3)] hover:text-[var(--color-fg)] transition"
          title="Show people in this room"
        >
          <Users className="h-3.5 w-3.5" />
          {members.length}
        </button>
      </div>

      <div className="flex-1 min-h-0 grid" style={{ gridTemplateColumns: showPeople ? '1fr 240px' : '1fr' }}>
        <div className="flex flex-col min-h-0">
          <MessageList messages={messages} currentUserId={currentUserId} users={allUsers} />
          <Composer roomId={roomId} users={allUsers} />
        </div>

        {showPeople ? (
          <aside className="border-l border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col min-h-0">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]">
              <div className="text-[11px] uppercase tracking-wider text-[var(--color-fg-dim)] font-semibold">
                People · {members.length}
              </div>
              <button
                type="button"
                onClick={() => setShowPeople(false)}
                className="p-1 rounded hover:bg-[var(--color-surface-3)] text-[var(--color-fg-muted)]"
                aria-label="Close people panel"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-2 py-2 space-y-0.5">
              {sortedMembers.length === 0 ? (
                <p className="px-2 py-3 text-[12px] text-[var(--color-fg-dim)]">
                  Nobody else in here yet.
                </p>
              ) : (
                sortedMembers.map((u) => {
                  const s = effectiveStatus(u);
                  return (
                    <div
                      key={u.id}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[var(--color-surface-2)]"
                    >
                      <div className="flex-1 min-w-0">
                        <UserPill user={u} size="xs" />
                      </div>
                      {s !== 'offline' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-[var(--color-fg-dim)]">
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: statusColor[s] }}
                          />
                          {statusLabel[s]}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[var(--color-fg-dim)]">offline</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
