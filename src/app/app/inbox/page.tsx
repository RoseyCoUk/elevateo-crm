import Link from 'next/link';
import { Inbox } from 'lucide-react';
import { PageHeader } from '@/components/shell/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPill } from '@/components/shared/user-pill';
import { markAllRead, markRead } from './actions';
import { getAllUsers, getNotifications, requireCurrentUser } from '@/lib/queries';
import { relativeTime } from '@/lib/utils';

const labelByType: Record<string, string> = {
  task_assigned: 'Task assigned',
  task_mentioned: 'Mention',
  task_review_requested: 'Review requested',
  task_approved: 'Approved',
  task_rejected: 'Rejected',
  comment_reply: 'Reply',
  project_assigned: 'Project',
  approval_pending: 'Approval pending',
};

export default async function InboxPage() {
  const { profile } = await requireCurrentUser();
  const [notifications, users] = await Promise.all([
    getNotifications(profile.id, 100),
    getAllUsers(),
  ]);
  const userMap = new Map(users.map((u) => [u.id, u]));

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Mentions, assignments, approvals, and project moves land here."
        actions={
          <form action={markAllRead}>
            <Button variant="secondary" size="sm">
              Mark all read
            </Button>
          </form>
        }
      />

      <div className="p-6">
        <Card>
          {notifications.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Inbox className="h-8 w-8 mx-auto text-[var(--color-fg-dim)] mb-2" />
              <div className="text-sm text-[var(--color-fg-muted)]">All caught up.</div>
            </div>
          ) : (
            notifications.map((n) => {
              const actor = n.actor_id ? userMap.get(n.actor_id) : null;
              const unread = !n.read_at;
              return (
                <form key={n.id} action={markRead.bind(null, n.id)}>
                  <Link
                    href={n.link ?? '#'}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition ${
                      unread ? 'bg-[var(--color-surface-2)]/40' : ''
                    }`}
                  >
                    <span
                      className={`mt-1.5 h-1.5 w-1.5 rounded-full ${
                        unread ? 'bg-[var(--color-accent)]' : 'bg-transparent'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge tone="default">{labelByType[n.type] ?? n.type}</Badge>
                        <span className="text-sm font-medium truncate">{n.title}</span>
                      </div>
                      {n.body ? (
                        <div className="text-xs text-[var(--color-fg-muted)] truncate">{n.body}</div>
                      ) : null}
                      <div className="flex items-center gap-2 text-[10px] text-[var(--color-fg-dim)] mt-1">
                        {actor ? <UserPill user={actor} size="xs" /> : null}
                        <span>· {relativeTime(n.created_at)}</span>
                      </div>
                    </div>
                  </Link>
                </form>
              );
            })
          )}
        </Card>
      </div>
    </div>
  );
}
