import { PageHeader } from '@/components/shell/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProfileForm } from './profile-form';
import { ThemeToggle } from './theme-toggle';
import { SoundToggle } from './sound-toggle';
import { signOut } from '@/app/(auth)/login/actions';
import { getDivisions, requireCurrentUser } from '@/lib/queries';
import { divisionTone, roleLabel } from '@/lib/formatters';

export default async function SettingsPage() {
  const { profile, authUser } = await requireCurrentUser();
  const divisions = await getDivisions();
  const div = profile.division_id ? divisions.find((d) => d.id === profile.division_id) : null;

  return (
    <div>
      <PageHeader title="Settings" description="Your profile + session." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm profile={profile} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-dim)] mb-1">
                Email
              </div>
              <div className="text-sm">{authUser.email}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-dim)] mb-1">
                Role
              </div>
              <Badge tone="default">{roleLabel[profile.role]}</Badge>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-dim)] mb-1">
                Cold call goal
              </div>
              <div className="text-sm">{profile.cold_call_goal ?? 40} calls / day</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-dim)] mb-1">
                Division
              </div>
              {div ? (
                <Badge tone={divisionTone[div.code] as any}>{div.name}</Badge>
              ) : (
                <span className="text-xs text-[var(--color-fg-dim)]">Unassigned</span>
              )}
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-dim)] mb-1">
                Theme
              </div>
              <ThemeToggle />
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-dim)] mb-1">
                Notification sound
              </div>
              <SoundToggle />
            </div>
            <form action={signOut}>
              <Button variant="secondary" size="sm">
                Sign out
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
