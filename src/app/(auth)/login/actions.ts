'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const Creds = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  next: z.string().optional(),
});

export type AuthState = { error?: string } | undefined;

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = Creds.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    next: formData.get('next') || undefined,
  });
  if (!parsed.success) return { error: 'Enter a valid email and a 6+ character password.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  redirect(parsed.data.next?.startsWith('/') ? parsed.data.next : '/app');
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const schema = Creds.extend({ full_name: z.string().min(1) });
  const parsed = schema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    full_name: formData.get('full_name'),
  });
  if (!parsed.success) return { error: 'Name, valid email, and a 6+ character password are required.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.full_name } },
  });
  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  redirect('/app');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
