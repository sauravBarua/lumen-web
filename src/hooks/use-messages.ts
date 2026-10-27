import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { flattenMessages } from '@/lib/messages-cache';
import { messagesKey } from '@/lib/query-keys';
import { listMessages } from '@/lib/rest';

export function useMessages(roomId: string) {
  const query = useInfiniteQuery({
    queryKey: messagesKey(roomId),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => listMessages(roomId, pageParam),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    // Kept fresh by realtime events and re-synced after reconnects, so no background refetching.
    staleTime: Infinity,
    gcTime: 10 * 60_000,
  });

  const messages = useMemo(() => (query.data ? flattenMessages(query.data) : []), [query.data]);

  return {
    messages,
    isPending: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
    hasOlder: query.hasNextPage,
    loadingOlder: query.isFetchingNextPage,
    loadOlder: query.fetchNextPage,
  };
}
