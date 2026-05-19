import { redirect } from 'next/navigation';
import { Pin, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/shell/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserPill } from '@/components/shared/user-pill';
import { createClient } from '@/lib/supabase/server';
import { getAllUsers, getDivisions, requireCurrentUser } from '@/lib/queries';
import { relativeTime } from '@/lib/utils';
import { AnnouncementForm } from './announcement-form';
import { DeleteAnnouncementButton } from './delete-announcement-button';
import type { Announcement } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

export default async function AnnouncementsAdminPage() {
  const { profile } = await requireCurrentUser();
  const divisions = await getDivisions();
  const adminDiv = divisions.find((d) => d.code === 'admin');
  const isAdmin = profile.role === 'owner' || profile.division_id === adminDiv?.id;
  if (!isAdmin) redirect('/app');

  const supabase = await createClient();
  const [{ data: announcements }, users] = await Promise.all([
    supabase
      .from('announcements')
      .select('*')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false }),
    getAllUsers(),
  ]);
  const userMap = new Map(users.map((u) => [u.id, u]));
  const list = (announcements ?? []) as Announcement[];

  return (
    <div>
      <PageHeader
        title="Announcements"
        description="Post once, everyone gets it in their inbox."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 p-6">
        <Card>
          <CardHeader>
            <CardTitle>New announcement</CardTitle>
          </CardHeader>
          <CardContent>
            <AnnouncementForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent</CardTitle>
          </CardHeader>
          <div>
            {list.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-[var(--color-fg-dim)]">
                Nothing posted yet.
              </div>
            ) : (
              list.map((a) => {
                const author = a.author_id ? userMap.get(a.author_id) : null;
                const expired = a.expires_at && new Date(a.expires_at) < new Date();
                return (
                  <div
                    key={a.id}
                    className="px-4 py-3 border-b border-[var(--color-border)] last:border-b-0"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {a.pinned ? (
                            <Pin className="h-3 w-3 text-[var(--color-warning)]" />
                          ) : null}
                          <div className="text-sm font-semibold truncate">{a.title}</div>
                          {expired ? <Badge tone="default">Expired</Badge> : null}
                        </div>
                        <div className="text-[12px] text-[var(--color-fg-muted)] whitespace-pre-wrap mb-2">
                          {a.body}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[var(--color-fg-dim)]">
                          <UserPill user={author ?? null} size="xs" />
                          <span>· {relativeTime(a.created_at)}</span>
                        </div>
                      </div>
                      <DeleteAnnouncementButton id={a.id} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
