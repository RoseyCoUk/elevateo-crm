'use client';

import { useEffect, useState } from 'react';
import { Mail, MapPin, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { initials } from '@/lib/utils';
import { roleLabel } from '@/lib/formatters';
import { effectiveStatus, statusLabel, statusColor } from '@/lib/presence';
import type { User } from '@/lib/supabase/types';
import { PresenceDot } from './presence-dot';

function liveTime(timezone: string | null | undefined): string | null {
  if (!timezone) return null;
  try {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    });
    const parts = fmt.formatToParts(new Date());
    const h = parts.find((p) => p.type === 'hour')?.value ?? '--';
    const m = parts.find((p) => p.type === 'minute')?.value ?? '--';
    const z = parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
    return `${h}:${m} ${z}`.trim();
  } catch {
    return null;
  }
}

export function ProfileCardDialog({
  user,
  open,
  onOpenChange,
}: {
  user: User;
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const [time, setTime] = useState<string | null>(() => liveTime(user.timezone));

  useEffect(() => {
    if (!open) return;
    setTime(liveTime(user.timezone));
    const tick = window.setInterval(() => setTime(liveTime(user.timezone)), 30_000);
    return () => window.clearInterval(tick);
  }, [open, user.timezone]);

  const name = user.full_name || user.email;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="sr-only">{name}</DialogTitle>
        </DialogHeader>
        <div className="flex items-start gap-4">
          <span className="relative inline-flex">
            <Avatar className="h-16 w-16">
              {user.avatar_url ? <AvatarImage src={user.avatar_url} alt={name} /> : null}
              <AvatarFallback>{initials(name)}</AvatarFallback>
            </Avatar>
            <PresenceDot user={user} size={14} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[16px] font-semibold text-[var(--color-fg)] truncate">
              {name}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Badge tone="default">{roleLabel[user.role]}</Badge>
              {user.supports === 'israel' ? (
                <span
                  className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-700"
                  title="Self-declared AIPAC supporter."
                >
                  <span aria-hidden style={{ fontSize: 11 }}>&#x2721;</span>
                  AIPAC
                </span>
              ) : null}
              {(() => {
                const s = effectiveStatus(user);
                if (s === 'offline') return null;
                return (
                  <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-fg-muted)]">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: statusColor[s] }}
                    />
                    {statusLabel[s]}
                  </span>
                );
              })()}
              {user.is_active ? null : <Badge tone="default">Inactive</Badge>}
            </div>
            {user.bio ? (
              <p className="mt-2 text-[13px] text-[var(--color-fg-muted)]">{user.bio}</p>
            ) : null}
            {user.nationality ? (
              <p className="mt-1 text-[11px] text-[var(--color-fg-dim)]">
                {user.nationality}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-4 space-y-2 text-[12.5px] text-[var(--color-fg-muted)]">
          <a
            href={`mailto:${user.email}`}
            className="flex items-center gap-2 hover:text-[var(--color-fg)]"
          >
            <Mail className="h-3.5 w-3.5" />
            {user.email}
          </a>
          {user.timezone ? (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" />
              {user.timezone}
            </div>
          ) : null}
          {time ? (
            <div className="flex items-center gap-2 tabular-nums">
              <Clock className="h-3.5 w-3.5" />
              Local time {time}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
