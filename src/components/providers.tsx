'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Session } from 'next-auth';
import { SessionProvider, signOut, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

/** When the API rejects the refresh token the session is dead: send the user to sign in again. */
function SessionWatcher() {
  const { data } = useSession();
  useEffect(() => {
    if (data?.error === 'RefreshTokenError') {
      void signOut({ redirectTo: '/login?reason=session_expired' });
    }
  }, [data?.error]);
  return null;
}

export function Providers({ session, children }: { session: Session; children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
      }),
  );

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        <SessionWatcher />
        {children}
      </QueryClientProvider>
    </SessionProvider>
  );
}
