'use client';

import Link from 'next/link';
import { Bell, ChevronDown, LogOut, User as UserIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from '@/app/(auth)/login/actions';
import { initials } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { roleLabel } from '@/lib/formatters';
import { NotifySound } from './notify-sound';
import type { User } from '@/lib/supabase/types';

export function Topbar({ user, unread }: { user: User | null; unread: number }) {
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
        <NotifySound unread={unread} />
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
            <Avatar>
              {user?.avatar_url ? (
                <AvatarImage src={user.avatar_url} alt={user.full_name || user.email} />
              ) : null}
              <AvatarFallback>{initials(user?.full_name || user?.email || '?')}</AvatarFallback>
            </Avatar>
            <div className="text-left hidden sm:block pr-1">
              <div className="text-[12px] font-medium leading-none">
                {user?.full_name || user?.email}
              </div>
              <div className="text-[11px] text-[var(--color-fg-dim)] mt-0.5">
                {user ? roleLabel[user.role] : ''}
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
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
            <DropdownMenuItem asChild>
              <Link href="/app/settings">
                <UserIcon className="h-3.5 w-3.5" /> Profile + settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="text-[var(--color-danger)]">
              <form action={signOut}>
                <button type="submit" className="flex items-center gap-2 w-full">
                  <LogOut className="h-3.5 w-3.5" /> Sign out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
