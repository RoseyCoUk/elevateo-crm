import { redirect } from 'next/navigation';
import { getDivisions, requireCurrentUser } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireCurrentUser();
  const divisions = await getDivisions();
  const adminDiv = divisions.find((d) => d.code === 'admin');
  const isAdmin = profile.role === 'owner' || profile.division_id === adminDiv?.id;
  if (!isAdmin) redirect('/app');
  return <>{children}</>;
}
