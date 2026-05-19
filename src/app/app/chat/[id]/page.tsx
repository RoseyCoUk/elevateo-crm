import { notFound } from 'next/navigation';
import { Hash } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getAllUsers, getDivisions, requireCurrentUser } from '@/lib/queries';
import { UserPill } from '@/components/shared/user-pill';
import { RoomShell } from '../room-shell';
import type { User } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

export default async function ChatRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireCurrentUser();
  const supabase = await createClient();

  const { data: room } = await supabase
    .from('chat_rooms')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!room) notFound();

  const [users, divisions, { data: messages }] = await Promise.all([
    getAllUsers(),
    getDivisions(),
    supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', id)
      .order('created_at', { ascending: true })
      .limit(200),
  ]);

  const userMap = new Map(users.map((u) => [u.id, u]));
  let title: React.ReactNode = 'Room';
  let members: User[] = [];

  if (room.kind === 'division') {
    const div = divisions.find((d) => d.id === room.division_id);
    title = (
      <span className="inline-flex items-center gap-1.5">
        <Hash className="h-3.5 w-3.5" />
        {div?.name ?? 'Division'}
      </span>
    );
    if (div) {
      members = users.filter(
        (u) =>
          u.is_active &&
          (u.division_id === div.id || (u.divisions ?? []).includes(div.code)),
      );
    }
  } else if (room.kind === 'dm') {
    const otherId = room.user_a_id === profile.id ? room.user_b_id : room.user_a_id;
    const other = otherId ? userMap.get(otherId) : null;
    title = <UserPill user={other ?? null} size="sm" />;
    const me = userMap.get(profile.id);
    members = [me, other].filter((u): u is User => Boolean(u));
  }

  const msgs = (messages ?? []) as Array<{
    id: string;
    room_id: string;
    author_id: string | null;
    body: string;
    pinned: boolean;
    created_at: string;
  }>;

  return (
    <RoomShell
      roomId={id}
      title={title}
      members={members}
      messages={msgs}
      currentUserId={profile.id}
      allUsers={users}
    />
  );
}
