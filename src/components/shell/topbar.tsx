'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, ChevronDown, LogOut, User as UserIcon, Circle, Clock, MinusCircle, RotateCcw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOutSilent } from '@/app/(auth)/login/actions';
import { setPresenceStatus } from '@/app/app/presence-actions';
import { initials } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { roleLabel } from '@/lib/formatters';
import { effectiveStatus, statusLabel } from '@/lib/presence';
import { PresenceDot } from '@/components/shared/presence-dot';
import { NotifySound } from './notify-sound';
import type { User } from '@/lib/supabase/types';

export function Topbar({
  user,
  unread,
  latestType,
}: {
  user: User | null;
  unread: number;
  latestType: string | null;
}) {
  const router = useRouter();
  const [signingOut, startSignOut] = useTransition();
  const [, startStatus] = useTransition();

  function pickStatus(s: 'online' | 'away' | 'dnd' | null) {
    startStatus(async () => {
      await setPresenceStatus(s);
      router.refresh();
    });
  }

  const current = user ? effectiveStatus(user) : 'offline';

  function handleSignOut() {
    // Play the descender now while the user gesture is fresh — it'll survive
    // the client-side navigation to /farewell.
    if (typeof window !== 'undefined' && localStorage.getItem('notify-sound-enabled') !== 'false') {
      const audio = new Audio('/sounds/descender.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
      try {
        sessionStorage.setItem('descender-playing', String(Date.now()));
      } catch {}
    }
    startSignOut(async () => {
      const { name } = await signOutSilent();
      try { sessionStorage.setItem('transition-in', '1'); } catch {}
      const params = name ? `?name=${encodeURIComponent(name)}` : '';
      router.push(`/farewell${params}`);
    });
  }
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur px-5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-[12px] text-[var(--color-fg-muted)]">
        <span>
          {new Date().toLocaleDateString('en-GB', {
            weekday: 'long',
            day: '2-digit',
            month: 'short',
          })}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <NotifySound unread={unread} latestType={latestType} />
        <Link
          href="/app/inbox"
          className="relative inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--color-surface-3)] transition"
        >
          <Bell className="h-4 w-4 text-[var(--color-fg-muted)]" />
          {unread > 0 ? (
            <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[var(--color-danger)] text-white text-[10px] font-semibold flex items-center justify-center">
              {unread > 99 ? '99+' : unread}
            </span>
          ) : null}
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-full px-1.5 py-1 hover:bg-[var(--color-surface-3)] transition">
            <span className="relative inline-flex">
              <Avatar>
                {user?.avatar_url ? (
                  <AvatarImage src={user.avatar_url} alt={user.full_name || user.email} />
                ) : null}
                <AvatarFallback>{initials(user?.full_name || user?.email || '?')}</AvatarFallback>
              </Avatar>
              {user ? <PresenceDot user={user} size={10} /> : null}
            </span>
            <div className="text-left hidden sm:block pr-1">
              <div className="text-[12px] font-medium leading-none">
                {user?.full_name || user?.email}
              </div>
              <div className="text-[11px] text-[var(--color-fg-dim)] mt-0.5">
                {user ? statusLabel[current] : ''}
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>
              <div className="space-y-1 px-1 py-1">
                <div className="text-[13px] font-semibold text-[var(--color-fg)]">
                  {user?.full_name}
                </div>
                <div className="text-[11px] text-[var(--color-fg-muted)]">{user?.email}</div>
                {user ? (
                  <Badge tone="default" className="mt-1.5">
                    {roleLabel[user.role]}
                  </Badge>
                ) : null}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="px-1.5 pt-1 pb-0.5 text-[10px] uppercase tracking-wider text-[var(--color-fg-dim)]">
              Status
            </div>
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); pickStatus('online'); }}>
              <Circle className="h-3 w-3 fill-[#34c759] text-[#34c759]" />
              Online
              {current === 'online' && user?.presence_status === 'online' ? (
                <span className="ml-auto text-[10px] text-[var(--color-fg-dim)]">current</span>
              ) : null}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); pickStatus('away'); }}>
              <Clock className="h-3.5 w-3.5 text-[#ff9f0a]" />
              Away
              {user?.presence_status === 'away' ? (
                <span className="ml-auto text-[10px] text-[var(--color-fg-dim)]">current</span>
              ) : null}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); pickStatus('dnd'); }}>
              <MinusCircle className="h-3.5 w-3.5 text-[#ff3b30]" />
              Do not disturb
              {user?.presence_status === 'dnd' ? (
                <span className="ml-auto text-[10px] text-[var(--color-fg-dim)]">current</span>
              ) : null}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); pickStatus(null); }}>
              <RotateCcw className="h-3.5 w-3.5 text-[var(--color-fg-muted)]" />
              Set automatically
              {!user?.presence_status ? (
                <span className="ml-auto text-[10px] text-[var(--color-fg-dim)]">current</span>
              ) : null}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/app/settings">
                <UserIcon className="h-3.5 w-3.5" /> Profile + settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-[var(--color-danger)]"
              disabled={signingOut}
              onSelect={(e) => {
                e.preventDefault();
                handleSignOut();
              }}
            >
              <LogOut className="h-3.5 w-3.5" />
              {signingOut ? 'Signing out...' : 'Sign out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
