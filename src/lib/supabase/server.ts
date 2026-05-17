import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { env, assertSupabaseEnv } from '@/lib/env';

export async function createClient() {
  assertSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet) {
        try {
          toSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component; safe to ignore — the middleware refresh handles it.
        }
      },
    },
  });
}
