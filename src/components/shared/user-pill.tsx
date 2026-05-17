import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { initials } from '@/lib/utils';
import type { User } from '@/lib/supabase/types';

export function UserPill({
  user,
  size = 'sm',
}: {
  user: Pick<User, 'full_name' | 'email'> | null | undefined;
  size?: 'xs' | 'sm';
}) {
  if (!user) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-fg-dim)]">
        <span className="h-5 w-5 rounded-full bg-[var(--color-surface-3)] flex items-center justify-center text-[9px]">
          ?
        </span>
        Unassigned
      </span>
    );
  }
  const name = user.full_name || user.email;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Avatar className={size === 'xs' ? 'h-5 w-5' : 'h-6 w-6'}>
        <AvatarFallback>{initials(name)}</AvatarFallback>
      </Avatar>
      <span className={size === 'xs' ? 'text-[11px]' : 'text-xs'}>{name}</span>
    </span>
  );
}
