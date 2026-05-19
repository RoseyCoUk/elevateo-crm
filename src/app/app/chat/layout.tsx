import Link from 'next/link';
import { Hash, MessageCircle, Plus } from 'lucide-react';
import { PageHeader } from '@/components/shell/page-header';
import { UserPill } from '@/components/shared/user-pill';
import { createClient } from '@/lib/supabase/server';
import { getAllUsers, getDivisions, requireCurrentUser } from '@/lib/queries';
import { StartDmButton } from './start-dm-button';

export const dynamic = 'force-dynamic';

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireCurrentUser();
  const divisions = await getDivisions();
  const users = await getAllUsers();
  const supabase = await createClient();

  const { data: rooms } = await supabase
    .from('chat_rooms')
    .select('*')
    .order('created_at');

  const userMap = new Map(users.map((u) => [u.id, u]));
  const divMap = new Map(divisions.map((d) => [d.id, d]));

  const divisionRooms = (rooms ?? []).filter((r) => r.kind === 'division');
  const dmRooms = (rooms ?? []).filter((r) => r.kind === 'dm');

  return (
    <div className="flex flex-col h-full min-h-0">
      <PageHeader
        title="Chat"
        description="Not a Telegram replacement. Use it to keep work decisions tied to the CRM — quick async questions, task pings, lightweight nudges. Messages auto-delete after 7 days unless pinned."
      />
      <div className="grid grid-cols-[260px_1fr] gap-0 flex-1 min-h-0 border-t border-[var(--color-border)]">
        <aside className="border-r border-[var(--color-border)] bg-[var(--color-surface)] overflow-y-auto p-3 min-h-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-dim)] mb-1.5 px-2">
            Divisions
          </div>
          <div className="space-y-0.5 mb-4">
            {divisionRooms.map((r) => {
              const div = divMap.get(r.division_id!);
              if (!div) return null;
              return (
                <Link
                  key={r.id}
                  href={`/app/chat/${r.id}`}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-3)]/70 hover:text-[var(--color-fg)] transition"
                >
                  <Hash className="h-3.5 w-3.5" />
                  <span>{div.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center justify-between mb-1.5 px-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-dim)]">
              Direct messages
            </div>
            <StartDmButton users={users.filter((u) => u.id !== profile.id && u.is_active)} />
          </div>
          <div className="space-y-0.5">
            {dmRooms.length === 0 ? (
              <p className="px-2.5 text-[11px] text-[var(--color-fg-dim)]">
                No DMs yet. Start one with the + button.
              </p>
            ) : (
              dmRooms.map((r) => {
                const otherId =
                  r.user_a_id === profile.id ? r.user_b_id : r.user_a_id;
                const other = otherId ? userMap.get(otherId) : null;
                if (!other) return null;
                return (
                  <Link
                    key={r.id}
                    href={`/app/chat/${r.id}`}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-3)]/70 hover:text-[var(--color-fg)] transition"
                  >
                    <UserPill user={other} size="xs" />
                  </Link>
                );
              })
            )}
          </div>
        </aside>

        <section className="flex flex-col min-h-0 bg-[var(--color-bg)]">{children}</section>
      </div>
    </div>
  );
}
