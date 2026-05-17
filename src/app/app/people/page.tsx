import { PageHeader } from '@/components/shell/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserPill } from '@/components/shared/user-pill';
import { getAllUsers, getDivisions } from '@/lib/queries';
import { divisionTone, roleLabel } from '@/lib/formatters';

export default async function PeoplePage() {
  const [users, divisions] = await Promise.all([getAllUsers(), getDivisions()]);
  const divMap = new Map(divisions.map((d) => [d.id, d]));
  const userMap = new Map(users.map((u) => [u.id, u]));

  return (
    <div>
      <PageHeader
        title="People"
        description="Everyone in the room. Who reports to whom drives task authority."
      />

      <div className="p-6">
        <Card>
          <div className="grid grid-cols-[1fr_140px_140px_180px_60px] text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-dim)] px-4 py-2 border-b border-[var(--color-border)]">
            <div>Name</div>
            <div>Role</div>
            <div>Division</div>
            <div>Reports to</div>
            <div className="text-right">Status</div>
          </div>
          {users.map((u) => {
            const div = u.division_id ? divMap.get(u.division_id) : null;
            const manager = u.manager_id ? userMap.get(u.manager_id) : null;
            return (
              <div
                key={u.id}
                className="grid grid-cols-[1fr_140px_140px_180px_60px] items-center px-4 py-2.5 border-b border-[var(--color-border)]"
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
                  {u.is_active ? (
                    <Badge tone="success">Active</Badge>
                  ) : (
                    <Badge tone="default">Off</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}
