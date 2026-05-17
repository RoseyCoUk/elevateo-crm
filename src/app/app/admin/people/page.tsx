import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shell/page-header';
import { Card } from '@/components/ui/card';
import { UserPill } from '@/components/shared/user-pill';
import { Badge } from '@/components/ui/badge';
import { PersonEditor } from './person-editor';
import {
  getAllUsers,
  getDivisions,
  requireCurrentUser,
} from '@/lib/queries';
import { divisionTone, roleLabel } from '@/lib/formatters';

export default async function AdminPeoplePage() {
  const { profile } = await requireCurrentUser();
  const divisions = await getDivisions();
  const adminDiv = divisions.find((d) => d.code === 'admin');
  const isAdmin = profile.role === 'owner' || profile.division_id === adminDiv?.id;
  if (!isAdmin) redirect('/app');

  const users = await getAllUsers();
  const divMap = new Map(divisions.map((d) => [d.id, d]));
  const userMap = new Map(users.map((u) => [u.id, u]));

  return (
    <div>
      <PageHeader
        title="Manage people"
        description="Set role, division, and manager. Hierarchy drives task authority."
      />

      <div className="p-6">
        <Card>
          <div className="grid grid-cols-[1fr_120px_140px_180px_100px] text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-dim)] px-4 py-2 border-b border-[var(--color-border)]">
            <div>Person</div>
            <div>Role</div>
            <div>Division</div>
            <div>Reports to</div>
            <div className="text-right">Edit</div>
          </div>
          {users.map((u) => {
            const div = u.division_id ? divMap.get(u.division_id) : null;
            const manager = u.manager_id ? userMap.get(u.manager_id) : null;
            return (
              <div
                key={u.id}
                className="grid grid-cols-[1fr_120px_140px_180px_100px] items-center px-4 py-2.5 border-b border-[var(--color-border)]"
              >
                <UserPill user={u} />
                <div>
                  <Badge tone="default">{roleLabel[u.role]}</Badge>
                </div>
                <div>
                  {div ? (
                    <Badge tone={divisionTone[div.code] as any}>{div.name}</Badge>
                  ) : (
                    <span className="text-[11px] text-[var(--color-fg-dim)]">—</span>
                  )}
                </div>
                <div>
                  {manager ? (
                    <UserPill user={manager} size="xs" />
                  ) : (
                    <span className="text-[11px] text-[var(--color-fg-dim)]">—</span>
                  )}
                </div>
                <div className="text-right">
                  <PersonEditor user={u} divisions={divisions} users={users} />
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}
