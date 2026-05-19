import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/shell/sidebar';
import { TransitionFader } from '@/components/shell/transition-fader';
import { ChameleonEasterEgg } from '@/components/shell/chameleon-easter-egg';
import { HeartbeatLoop } from '@/components/shell/heartbeat-loop';

export const dynamic = 'force-dynamic';

import { Topbar } from '@/components/shell/topbar';
import {
  getCurrentUser,
  getDivisions,
  getLatestUnreadType,
  getUnreadNotificationCount,
  getPendingApprovalsForUser,
} from '@/lib/queries';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUser();
  if (!session) redirect('/login');

  const [divisions, unread, latestType, pendingApprovals] = await Promise.all([
    getDivisions(),
    session.profile ? getUnreadNotificationCount(session.profile.id) : Promise.resolve(0),
    session.profile ? getLatestUnreadType(session.profile.id) : Promise.resolve(null),
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
      <Topbar user={session.profile} unread={unread} latestType={latestType} />
      <main className="overflow-y-auto bg-[var(--color-bg)]">{children}</main>
      <TransitionFader />
      <ChameleonEasterEgg />
      <HeartbeatLoop />
    </div>
  );
}
