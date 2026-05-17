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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { signOut } from '@/app/(auth)/login/actions';
import { initials } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { roleLabel } from '@/lib/formatters';
import type { User } from '@/lib/supabase/types';

export function Topbar({ user, unread }: { user: User | null; unread: number }) {
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-xs text-[var(--color-fg-dim)]">
        <span className="font-mono uppercase tracking-wider">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short' })}</span>
        <span className="h-1 w-1 rounded-full bg-[var(--color-fg-dim)]" />
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/app/inbox"
          className="relative inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-[var(--color-surface-2)]"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 ? (
            <span className="absolute -top-1 -right-1 min-w-4 px-1 h-4 rounded-full bg-[var(--color-accent)] text-black text-[10px] font-bold flex items-center justify-center">
              {unread > 99 ? '99+' : unread}
            </span>
          ) : null}
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-[var(--color-surface-2)]">
            <Avatar>
              <AvatarFallback>{initials(user?.full_name || user?.email || '?')}</AvatarFallback>
            </Avatar>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold leading-none">
                {user?.full_name || user?.email}
              </div>
              <div className="text-[10px] text-[var(--color-fg-dim)] mt-1">
                {user ? roleLabel[user.role] : ''}
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-[var(--color-fg)]">{user?.full_name}</div>
                <div className="text-[10px] text-[var(--color-fg-dim)] normal-case tracking-normal">
                  {user?.email}
                </div>
                {user ? <Badge tone="default" className="mt-1.5">{roleLabel[user.role]}</Badge> : null}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/app/settings">
                <UserIcon className="h-3.5 w-3.5" /> Profile + settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="text-red-300">
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
