import Link from 'next/link';
import { LoginForm } from './login-form';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <div className="h-8 w-8 rounded bg-[var(--color-accent)] flex items-center justify-center font-bold text-black">
          S
        </div>
        <div>
          <div className="text-base font-semibold leading-none">Soarx CRM</div>
          <div className="text-xs text-[var(--color-fg-muted)] mt-1">Agency war room</div>
        </div>
      </div>
      <h1 className="text-lg font-semibold mb-1">Sign in</h1>
      <p className="text-sm text-[var(--color-fg-muted)] mb-6">
        Use the email your operator added you with.
      </p>
      <LoginForm next={next} />
      <div className="text-xs text-[var(--color-fg-muted)] mt-6">
        New here?{' '}
        <Link href="/signup" className="text-[var(--color-accent)] hover:underline">
          Create an account
        </Link>
      </div>
    </div>
  );
}
