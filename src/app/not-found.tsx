import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-sm">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-accent)] mb-2">
          404
        </div>
        <h1 className="text-xl font-semibold mb-2">Nothing here.</h1>
        <p className="text-sm text-[var(--color-fg-muted)] mb-6">
          The page you're looking for doesn't exist, or you don't have access.
        </p>
        <Button asChild>
          <Link href="/app">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
