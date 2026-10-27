import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { Providers } from '@/components/providers';

// Everything under (app) needs a session. The proxy already redirects navigations;
// this is the second line of defence for server rendering.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.error) redirect('/login');
  return <Providers session={session}>{children}</Providers>;
}
