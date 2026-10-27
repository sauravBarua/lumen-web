'use client';

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Hash, Search, Users } from 'lucide-react';
import { useState } from 'react';
import { EmptyState, ErrorState } from '@/components/common/states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal, ModalHeader } from '@/components/ui/modal';
import { useDebounce } from '@/hooks/use-debounce';
import { publicRoomsKey, roomsKey } from '@/lib/query-keys';
import { joinRoom, listPublicRooms } from '@/lib/rest';
import { addRoom } from '@/lib/rooms-cache';
import type { Room } from '@/lib/types';
import { toast } from '@/stores/toast-store';

export function BrowseRoomsDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const q = useDebounce(search.trim());
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [joining, setJoining] = useState<string | null>(null);

  const list = useInfiniteQuery({
    queryKey: publicRoomsKey(q),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => listPublicRooms({ q: q || undefined, cursor: pageParam }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
  const items = list.data?.pages.flatMap((p) => p.items) ?? [];

  async function join(id: string) {
    setJoining(id);
    try {
      const room = await joinRoom(id);
      queryClient.setQueryData<Room[]>(roomsKey, (rooms) => addRoom(rooms ?? [], room));
      setJoined((cur) => new Set(cur).add(id));
    } catch (e) {
      toast.error('Could not join the room', e instanceof Error ? e.message : undefined);
    } finally {
      setJoining(null);
    }
  }

  return (
    <Modal onClose={onClose} labelledBy="browse-title" className="max-w-lg">
      <ModalHeader
        id="browse-title"
        title="Browse public rooms"
        description="Join a room to see its history and start chatting."
        onClose={onClose}
      />
      <div className="relative mt-4">
        <label htmlFor="browse-search" className="sr-only">
          Search public rooms
        </label>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id="browse-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search rooms"
          className="pl-9"
          data-autofocus
        />
      </div>

      <div className="mt-3 max-h-80 overflow-y-auto rounded-lg border border-border">
        {list.isPending ? (
          <ul
            className="animate-pulse divide-y divide-border"
            role="status"
            aria-label="Loading rooms"
          >
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex items-center gap-3 p-3">
                <span className="size-9 rounded-md bg-muted" />
                <span className="h-3.5 w-32 rounded bg-muted" />
              </li>
            ))}
          </ul>
        ) : list.isError ? (
          <ErrorState
            title="Couldn't load rooms"
            onRetry={() => void list.refetch()}
            className="py-8"
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Search}
            title={q ? `No results for “${q}”` : 'No public rooms yet'}
            description={
              q ? 'Check the spelling or try a different keyword.' : 'Create the first one.'
            }
            className="py-8"
          />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((room) => {
              const isJoined = room.joined || joined.has(room.id);
              return (
                <li key={room.id} data-room-id={room.id} className="flex items-center gap-3 p-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground">
                    <Hash className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{room.name}</p>
                    {room.description && (
                      <p className="truncate text-xs text-muted-foreground">{room.description}</p>
                    )}
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="size-3" aria-hidden="true" />
                      {room.memberCount} {room.memberCount === 1 ? 'member' : 'members'}
                    </p>
                  </div>
                  {isJoined ? (
                    <span className="inline-flex h-8 items-center gap-1 rounded-md bg-secondary px-3 text-xs font-medium text-secondary-foreground opacity-80">
                      <Check className="size-3.5" aria-hidden="true" />
                      Joined
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      className="h-8 px-3 text-xs"
                      loading={joining === room.id}
                      onClick={() => void join(room.id)}
                      aria-label={`Join ${room.name}`}
                    >
                      Join
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {list.hasNextPage && (
        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          loading={list.isFetchingNextPage}
          onClick={() => void list.fetchNextPage()}
        >
          Load more
        </Button>
      )}
    </Modal>
  );
}
