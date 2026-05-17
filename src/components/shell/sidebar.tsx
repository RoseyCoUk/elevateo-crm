'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Building2,
  GanttChartSquare,
  Users,
  Inbox,
  Settings2,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { divisionTone } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import type { Division, User } from '@/lib/supabase/types';

const navItems = [
  { href: '/app', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/app/approvals', label: 'Approvals', icon: ShieldCheck },
  { href: '/app/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/app/projects', label: 'Projects', icon: GanttChartSquare },
  { href: '/app/clients', label: 'Clients', icon: Building2 },
  { href: '/app/inbox', label: 'Notifications', icon: Inbox },
  { href: '/app/people', label: 'People', icon: Users },
];

export function Sidebar({
  divisions,
  pendingApprovals,
  user,
}: {
  divisions: Division[];
  pendingApprovals: number;
  user: User | null;
}) {
  const pathname = usePathname();
  const isAdmin = user && (user.role === 'owner' || divisions.find((d) => d.id === user.division_id)?.code === 'admin');

  return (
    <nav className="h-screen sticky top-0 flex flex-col">
      <div className="px-3 py-3 border-b border-[var(--color-border)]">
        <Link href="/app" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-[var(--color-accent)] flex items-center justify-center font-bold text-black text-xs">
            S
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-none">Soarx CRM</span>
            <span className="text-[10px] text-[var(--color-fg-dim)] mt-1 uppercase tracking-wider">
              War room
            </span>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-2 space-y-0.5">
          {navItems.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition',
                  active
                    ? 'bg-[var(--color-surface-3)] text-[var(--color-fg)]'
                    : 'text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]'
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {item.href === '/app/approvals' && pendingApprovals > 0 ? (
                  <Badge tone="accent" className="font-mono">{pendingApprovals}</Badge>
                ) : null}
              </Link>
            );
          })}
        </div>

        <div className="mt-5 px-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-dim)] px-2.5 mb-1.5">
            Divisions
          </div>
          <div className="space-y-0.5">
            {divisions.map((d) => {
              const href = `/app/divisions/${d.code}`;
              const active = pathname?.startsWith(href);
              return (
                <Link
                  key={d.id}
                  href={href}
                  className={cn(
                    'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition',
                    active
                      ? 'bg-[var(--color-surface-3)] text-[var(--color-fg)]'
                      : 'text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]'
                  )}
                >
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      d.code === 'sales' && 'bg-pink-400',
                      d.code === 'marketing' && 'bg-amber-400',
                      d.code === 'technology' && 'bg-sky-400',
                      d.code === 'ecommerce' && 'bg-violet-400',
                      d.code === 'admin' && 'bg-slate-400'
                    )}
                  />
                  <span className="flex-1">{d.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {isAdmin ? (
          <div className="mt-5 px-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-dim)] px-2.5 mb-1.5">
              Admin
            </div>
            <div className="space-y-0.5">
              <Link
                href="/app/admin/people"
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition',
                  pathname?.startsWith('/app/admin/people')
                    ? 'bg-[var(--color-surface-3)] text-[var(--color-fg)]'
                    : 'text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]'
                )}
              >
                <Users className="h-4 w-4" />
                Manage people
              </Link>
              <Link
                href="/app/admin/divisions"
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition',
                  pathname?.startsWith('/app/admin/divisions')
                    ? 'bg-[var(--color-surface-3)] text-[var(--color-fg)]'
                    : 'text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]'
                )}
              >
                <FolderKanban className="h-4 w-4" />
                Divisions
              </Link>
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t border-[var(--color-border)] p-2">
        <Link
          href="/app/settings"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-[var(--color-fg-dim)] hover:bg-[var(--color-surface-2)]"
        >
          <Settings2 className="h-3.5 w-3.5" />
          Settings
        </Link>
      </div>
    </nav>
  );
}
