import { cn } from '@/lib/utils';

export function PageHeader({
  title,
  description,
  actions,
  meta,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight truncate">{title}</h1>
          {description ? (
            <p className="text-sm text-[var(--color-fg-muted)] mt-1">{description}</p>
          ) : null}
          {meta ? <div className="mt-2 flex flex-wrap gap-2">{meta}</div> : null}
        </div>
        {actions ? <div className="flex items-center gap-2 shrink-0">{actions}</div> : null}
      </div>
    </div>
  );
}
