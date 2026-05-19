import { FarewellAnimation } from './farewell-animation';

export const dynamic = 'force-dynamic';

export default async function FarewellPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string }>;
}) {
  const { name } = await searchParams;
  return <FarewellAnimation name={name ?? ''} />;
}
