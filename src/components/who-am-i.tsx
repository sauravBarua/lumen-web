'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/browser';
import { Button } from '@/components/ui/button';

/** Calls GET /auth/me from the browser with the session's bearer token: proves the whole chain works. */
export function WhoAmI() {
  const { data, error, isPending, refetch } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data, response } = await apiClient.GET('/api/v1/auth/me');
      if (!data) throw new Error(`The API answered ${response.status}`);
      return data;
    },
  });

  if (isPending)
    return <p className="text-sm text-muted-foreground">Asking the API who you are…</p>;
  if (error) {
    return (
      <div className="space-y-2 text-sm">
        <p className="text-destructive">Could not reach the API: {error.message}</p>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    );
  }
  return (
    <p className="text-sm text-muted-foreground">
      The API says you are <span className="font-medium text-foreground">@{data.username}</span> (
      {data.email}), role {data.role}.
    </p>
  );
}
