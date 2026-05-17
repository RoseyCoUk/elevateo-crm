import Link from 'next/link';
import { SignupForm } from './signup-form';

export default function SignupPage() {
  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <div className="h-8 w-8 rounded bg-[var(--color-accent)] flex items-center justify-center font-bold text-black">
          S
        </div>
        <div>
          <div className="text-base font-semibold leading-none">Soarx CRM</div>
          <div className="text-xs text-[var(--color-fg-muted)] mt-1">Create your account</div>
        </div>
      </div>
      <h1 className="text-lg font-semibold mb-1">Sign up</h1>
      <p className="text-sm text-[var(--color-fg-muted)] mb-6">
        Your division + manager are assigned by an admin after signup.
      </p>
      <SignupForm />
      <div className="text-xs text-[var(--color-fg-muted)] mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-[var(--color-accent)] hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
