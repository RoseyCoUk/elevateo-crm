import type { User } from './supabase/types';

export type EffectiveStatus = 'online' | 'away' | 'dnd' | 'offline';

const AWAY_AFTER_MS = 15 * 60 * 1000; // 15 minutes
const OFFLINE_AFTER_MS = 3 * 60 * 60 * 1000; // 3 hours

/**
 * Compute presence to show for a user. Manual override wins; otherwise we
 * derive it from last_seen_at:
 *   < 15 min      -> online
 *   15 min - 3 h  -> away
 *   > 3 h or null -> offline
 */
export function effectiveStatus(
  user: Pick<User, 'last_seen_at' | 'presence_status'>,
  now: Date = new Date(),
): EffectiveStatus {
  const manual = user.presence_status;
  if (manual === 'online') return 'online';
  if (manual === 'away') return 'away';
  if (manual === 'dnd') return 'dnd';
  if (!user.last_seen_at) return 'offline';
  const diff = now.getTime() - new Date(user.last_seen_at).getTime();
  if (diff < AWAY_AFTER_MS) return 'online';
  if (diff < OFFLINE_AFTER_MS) return 'away';
  return 'offline';
}

export const statusLabel: Record<EffectiveStatus, string> = {
  online: 'Online',
  away: 'Away',
  dnd: 'Do not disturb',
  offline: 'Offline',
};

export const statusColor: Record<EffectiveStatus, string> = {
  online: '#34c759',
  away: '#ff9f0a',
  dnd: '#ff3b30',
  offline: 'transparent',
};
