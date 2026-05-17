import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
  {
    variants: {
      tone: {
        default: 'border-[var(--color-border-strong)] bg-[var(--color-surface-2)] text-[var(--color-fg-muted)]',
        accent: 'border-[var(--color-accent)] bg-orange-500/10 text-[var(--color-accent)]',
        success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
        warning: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
        danger: 'border-red-500/40 bg-red-500/10 text-red-300',
        info: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
        violet: 'border-violet-500/40 bg-violet-500/10 text-violet-300',
        pink: 'border-pink-500/40 bg-pink-500/10 text-pink-300',
      },
    },
    defaultVariants: { tone: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { badgeVariants };
