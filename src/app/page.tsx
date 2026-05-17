import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { env } from '@/lib/env';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function Home() {
  if (env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect('/app');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--color-border)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-[var(--color-accent)] flex items-center justify-center font-bold text-black text-sm">
            S
          </div>
          <span className="font-semibold text-sm">Soarx CRM</span>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Create account</Link>
          </Button>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 text-[10px] font-semibold tracking-widest uppercase text-[var(--color-accent)] mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
            Agency operating system
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Run the company like a war room.
          </h1>
          <p className="text-[var(--color-fg-muted)] mb-8 text-balance">
            Hierarchical task flow, division ownership, approval queues. Replaces Telegram chaos,
            forgotten tasks, and random DMs with one operational source of truth.
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild size="lg">
              <Link href="/signup">Open the room</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/login">I have an account</Link>
            </Button>
          </div>
        </div>
      </main>
      <footer className="border-t border-[var(--color-border)] px-6 py-3 text-[10px] tracking-wider uppercase text-[var(--color-fg-dim)]">
        Soarx CRM
      </footer>
    </div>
  );
}
