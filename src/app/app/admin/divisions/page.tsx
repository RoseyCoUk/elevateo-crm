import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/shell/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserPill } from '@/components/shared/user-pill';
import { getAllUsers, getDivisions, requireCurrentUser } from '@/lib/queries';
import { divisionTone } from '@/lib/formatters';

export default async function AdminDivisionsPage() {
  const { profile } = await requireCurrentUser();
  const divisions = await getDivisions();
  const adminDiv = divisions.find((d) => d.code === 'admin');
  const isAdmin = profile.role === 'owner' || profile.division_id === adminDiv?.id;
  if (!isAdmin) redirect('/app');

  const users = await getAllUsers();
  const userMap = new Map(users.map((u) => [u.id, u]));

  return (
    <div>
      <PageHeader
        title="Divisions"
        description="Five divisions: Sales, Marketing, Technology, E-commerce, Admin. Set the owner of each."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-6">
        {divisions.map((d) => {
          const owner = d.owner_id ? userMap.get(d.owner_id) : null;
          const headcount = users.filter((u) => u.division_id === d.id).length;
          return (
            <Card key={d.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Badge tone={divisionTone[d.code] as any}>{d.name}</Badge>
                <span className="text-[10px] text-[var(--color-fg-dim)] font-mono">
                  {headcount} ppl
                </span>
              </div>
              {d.description ? (
                <p className="text-xs text-[var(--color-fg-muted)] mb-3">{d.description}</p>
              ) : null}
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-dim)] mb-1">
                  Owner
                </div>
                <UserPill user={owner ?? null} />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
