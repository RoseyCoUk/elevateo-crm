import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/shell/sidebar';

export const dynamic = 'force-dynamic';

import { Topbar } from '@/components/shell/topbar';
import {
  getCurrentUser,
  getDivisions,
  getUnreadNotificationCount,
  getPendingApprovalsForUser,
} from '@/lib/queries';
import { env } from '@/lib/env';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h2 className="text-lg font-semibold mb-2">Supabase env missing</h2>
          <p className="text-sm text-[var(--color-fg-muted)]">
            Copy <code className="font-mono text-xs">.env.local.example</code> to{' '}
            <code className="font-mono text-xs">.env.local</code> and fill in your Supabase project URL
            and anon key, then restart the dev server.
          </p>
        </div>
      </div>
    );
  }

  const session = await getCurrentUser();
  if (!session) redirect('/login');

  const [divisions, unread, pendingApprovals] = await Promise.all([
    getDivisions(),
    session.profile ? getUnreadNotificationCount(session.profile.id) : Promise.resolve(0),
    session.profile ? getPendingApprovalsForUser(session.profile.id) : Promise.resolve([]),
  ]);

  return (
    <div className="grid grid-cols-[220px_1fr] grid-rows-[48px_1fr] min-h-screen">
      <div className="row-span-2 border-r border-[var(--color-border)] bg-[var(--color-surface)]">
        <Sidebar
          divisions={divisions}
          pendingApprovals={pendingApprovals.length}
          user={session.profile}
        />
      </div>
      <Topbar user={session.profile} unread={unread} />
      <main className="overflow-y-auto bg-[var(--color-bg)]">{children}</main>
    </div>
  );
}
