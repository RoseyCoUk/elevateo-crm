'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signUp, type AuthState } from '../login/actions';

export function SignupForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, undefined);
  return (
    <form action={action} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" name="full_name" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" minLength={6} required />
      </div>
      {state?.error ? (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 text-red-300 text-xs px-3 py-2">
          {state.error}
        </div>
      ) : null}
      <Button className="w-full" disabled={pending}>
        {pending ? 'Creating account...' : 'Create account'}
      </Button>
    </form>
  );
}
