'use client';

import Image from 'next/image';
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
  Network,
  FileText,
  BookOpen,
  PhoneOutgoing,
  ExternalLink,
  Wrench,
  Megaphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { Division, User } from '@/lib/supabase/types';

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  external?: boolean;
};

const navGroups: NavItem[][] = [
  // Home + inbox
  [
    { href: '/app', label: 'Command Center', icon: LayoutDashboard, exact: true },
    { href: '/app/inbox', label: 'Notifications', icon: Inbox },
  ],
  // Work
  [
    { href: '/app/approvals', label: 'Approvals', icon: ShieldCheck },
    { href: '/app/tasks', label: 'Tasks', icon: CheckSquare },
    { href: '/app/projects', label: 'Projects', icon: GanttChartSquare },
    { href: '/app/clients', label: 'Clients', icon: Building2 },
  ],
  // Org
  [{ href: '/app/hierarchy', label: 'Hierarchy', icon: Network }],
  // Resources
  [
    { href: '/app/sops', label: 'SOP library', icon: BookOpen },
    { href: 'https://calls.elevateoco.com/leads', label: 'Cold Caller', icon: PhoneOutgoing, external: true },
    { href: '/app/proposals', label: 'Proposals', icon: FileText },
  ],
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
  const isAdmin =
    user &&
    (user.role === 'owner' ||
      divisions.find((d) => d.id === user.division_id)?.code === 'admin');

  return (
    <nav className="h-screen sticky top-0 flex flex-col bg-[var(--color-surface)]">
      <div className="px-4 py-3.5 border-b border-[var(--color-border)]">
        <Link href="/app" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.08)]">
            <Image
              src="/elevateo-logo.png"
              alt="Elevateo logo"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] font-semibold leading-none tracking-tight">Elevateoco</span>
            <span className="text-[11px] text-[var(--color-fg-dim)] mt-1">CRM</span>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-3">
        <div className="px-2">
          {navGroups.map((group, gi) => (
            <div
              key={gi}
              className={cn('space-y-0.5', gi > 0 && 'mt-3')}
            >
              {group.map((item) => {
                if (item.external) {
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-3)]/70 hover:text-[var(--color-fg)] transition"
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="flex-1">{item.label}</span>
                      <ExternalLink className="h-3 w-3 text-[var(--color-fg-dim)]" />
                    </a>
                  );
                }
                const active = item.exact
                  ? pathname === item.href
                  : pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] transition',
                      active
                        ? 'bg-[var(--color-surface-3)] text-[var(--color-fg)] font-medium'
                        : 'text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-3)]/70 hover:text-[var(--color-fg)]'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1">{item.label}</span>
                    {item.href === '/app/approvals' && pendingApprovals > 0 ? (
                      <Badge tone="accent">{pendingApprovals}</Badge>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        <div className="mt-6 px-2">
          <div className="text-[11px] font-medium text-[var(--color-fg-dim)] px-2.5 mb-1.5">
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
                    'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] transition',
                    active
                      ? 'bg-[var(--color-surface-3)] text-[var(--color-fg)] font-medium'
                      : 'text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-3)]/70 hover:text-[var(--color-fg)]'
                  )}
                >
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      d.code === 'sales' && 'bg-pink-500',
                      d.code === 'marketing' && 'bg-orange-500',
                      d.code === 'technology' && 'bg-sky-500',
                      d.code === 'ecommerce' && 'bg-violet-500',
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
          <div className="mt-6 px-2">
            <div className="text-[11px] font-medium text-[var(--color-fg-dim)] px-2.5 mb-1.5">
              Admin
            </div>
            <div className="space-y-0.5">
              <Link
                href="/app/admin/people"
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] transition',
                  pathname?.startsWith('/app/admin/people')
                    ? 'bg-[var(--color-surface-3)] text-[var(--color-fg)] font-medium'
                    : 'text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-3)]/70 hover:text-[var(--color-fg)]'
                )}
              >
                <Users className="h-4 w-4" />
                Manage people
              </Link>
              <Link
                href="/app/admin/divisions"
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] transition',
                  pathname?.startsWith('/app/admin/divisions')
                    ? 'bg-[var(--color-surface-3)] text-[var(--color-fg)] font-medium'
                    : 'text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-3)]/70 hover:text-[var(--color-fg)]'
                )}
              >
                <FolderKanban className="h-4 w-4" />
                Divisions
              </Link>
              <Link
                href="/app/admin/it-settings"
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] transition',
                  pathname?.startsWith('/app/admin/it-settings')
                    ? 'bg-[var(--color-surface-3)] text-[var(--color-fg)] font-medium'
                    : 'text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-3)]/70 hover:text-[var(--color-fg)]'
                )}
              >
                <Wrench className="h-4 w-4" />
                IT settings
              </Link>
              <Link
                href="/app/admin/announcements"
                className={cn(
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] transition',
                  pathname?.startsWith('/app/admin/announcements')
                    ? 'bg-[var(--color-surface-3)] text-[var(--color-fg)] font-medium'
                    : 'text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-3)]/70 hover:text-[var(--color-fg)]'
                )}
              >
                <Megaphone className="h-4 w-4" />
                Announcements
              </Link>
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t border-[var(--color-border)] p-2">
        <Link
          href="/app/settings"
          className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-3)]"
        >
          <Settings2 className="h-3.5 w-3.5" />
          Settings
        </Link>
      </div>
    </nav>
  );
}
