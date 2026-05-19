import { effectiveStatus, statusColor, statusLabel, type EffectiveStatus } from '@/lib/presence';
import type { User } from '@/lib/supabase/types';

/**
 * Small Teams-style presence indicator. Sits at the bottom-right of an avatar.
 * Green = online, gold (clock) = away, red (minus) = DND.
 * Offline renders nothing so the avatar stays clean.
 */
export function PresenceDot({
  user,
  size = 10,
  className,
}: {
  user: Pick<User, 'last_seen_at' | 'presence_status'> | null | undefined;
  size?: number;
  className?: string;
}) {
  if (!user) return null;
  const status: EffectiveStatus = effectiveStatus(user);
  if (status === 'offline') return null;
  const color = statusColor[status];

  return (
    <span
      title={statusLabel[status]}
      className={
        'absolute pointer-events-none flex items-center justify-center rounded-full ring-2 ring-[var(--color-surface)] ' +
        (className ?? '')
      }
      style={{
        width: size,
        height: size,
        right: -1,
        bottom: -1,
        background: color,
      }}
    >
      {status === 'dnd' ? (
        <svg viewBox="0 0 10 10" width={size * 0.7} height={size * 0.7} aria-hidden>
          <line
            x1="2.5"
            y1="5"
            x2="7.5"
            y2="5"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ) : status === 'away' ? (
        <svg viewBox="0 0 10 10" width={size * 0.8} height={size * 0.8} aria-hidden>
          {/* tiny clock hands — 12 + 3 o'clock */}
          <line x1="5" y1="5" x2="5" y2="2.6" stroke="white" strokeWidth="1.1" strokeLinecap="round" />
          <line x1="5" y1="5" x2="7" y2="5" stroke="white" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      ) : null}
    </span>
  );
}
