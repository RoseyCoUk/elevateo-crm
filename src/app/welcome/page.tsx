import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { WelcomeAnimation } from './welcome-animation';

export const dynamic = 'force-dynamic';

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect('/login');

  const target = next && next.startsWith('/') ? next : '/app';
  return <WelcomeAnimation next={target} />;
}
