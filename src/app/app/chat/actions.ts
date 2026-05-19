'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireCurrentUser } from '@/lib/queries';

const MessageSchema = z.object({
  room_id: z.string().uuid(),
  body: z.string().min(1).max(4000),
});

function handleFromUser(u: { full_name: string | null; email: string }) {
  const nameSlug = (u.full_name ?? '').toLowerCase().split(/\s+/).filter(Boolean).join('.');
  const emailLocal = u.email.split('@')[0]?.toLowerCase() ?? '';
  return { nameSlug, emailLocal };
}

export async function sendMessage(formData: FormData) {
  const { profile } = await requireCurrentUser();
  const parsed = MessageSchema.safeParse({
    room_id: formData.get('room_id'),
    body: formData.get('body'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };

  const supabase = await createClient();
  const { error } = await supabase.from('chat_messages').insert({
    room_id: parsed.data.room_id,
    author_id: profile.id,
    body: parsed.data.body,
  });
  if (error) return { error: error.message };

  // Resolve @handles to user IDs and notify them.
  const handles = Array.from(parsed.data.body.matchAll(/@([\w.-]+)/g)).map((m) => m[1].toLowerCase());
  if (handles.length) {
    const { data: candidates } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('is_active', true);
    const matched = new Map<string, string>(); // userId -> handle that matched
    for (const cand of (candidates ?? []) as Array<{ id: string; full_name: string | null; email: string }>) {
      const { nameSlug, emailLocal } = handleFromUser(cand);
      for (const h of handles) {
        if (cand.id === profile.id) continue; // don't ping yourself
        if (
          (nameSlug && (nameSlug === h || nameSlug.startsWith(h + '.'))) ||
          (emailLocal && (emailLocal === h || emailLocal.startsWith(h + '.')))
        ) {
          if (!matched.has(cand.id)) matched.set(cand.id, h);
        }
      }
    }
    if (matched.size) {
      const sender = profile.full_name || profile.email;
      await supabase.from('notifications').insert(
        Array.from(matched.keys()).map((uid) => ({
          user_id: uid,
          actor_id: profile.id,
          type: 'chat_mention' as const,
          title: `${sender} mentioned you`,
          body: parsed.data.body.slice(0, 200),
          link: `/app/chat/${parsed.data.room_id}`,
        })),
      );
    }
  }

  revalidatePath(`/app/chat/${parsed.data.room_id}`);
  return { ok: true };
}

export async function togglePin(messageId: string, nextPinned: boolean) {
  await requireCurrentUser();
  const supabase = await createClient();
  const { data: msg } = await supabase
    .from('chat_messages')
    .select('room_id')
    .eq('id', messageId)
    .maybeSingle();
  if (!msg) return { error: 'Message not found' };

  const { error } = await supabase
    .from('chat_messages')
    .update({ pinned: nextPinned })
    .eq('id', messageId);
  if (error) return { error: error.message };

  revalidatePath(`/app/chat/${msg.room_id}`);
  return { ok: true };
}

export async function deleteMessage(messageId: string) {
  await requireCurrentUser();
  const supabase = await createClient();
  const { data: msg } = await supabase
    .from('chat_messages')
    .select('room_id')
    .eq('id', messageId)
    .maybeSingle();
  if (!msg) return { error: 'Message not found' };

  const { error } = await supabase.from('chat_messages').delete().eq('id', messageId);
  if (error) return { error: error.message };

  revalidatePath(`/app/chat/${msg.room_id}`);
  return { ok: true };
}

/**
 * Bumps last_read_at for the given room to now() for the current user.
 * Called when a chat room is opened so unread counts reset.
 */
export async function markRoomRead(roomId: string) {
  const { profile } = await requireCurrentUser();
  const supabase = await createClient();
  await supabase.from('chat_read_state').upsert(
    {
      user_id: profile.id,
      room_id: roomId,
      last_read_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,room_id' },
  );
  revalidatePath('/app/chat');
  revalidatePath('/app', 'layout');
  return { ok: true };
}

export async function startDM(otherUserId: string) {
  await requireCurrentUser();
  const parsed = z.string().uuid().safeParse(otherUserId);
  if (!parsed.success) return { error: 'Invalid user' };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_or_create_dm', { p_other: parsed.data });
  if (error) return { error: error.message };

  revalidatePath('/app/chat');
  redirect(`/app/chat/${data as string}`);
}
