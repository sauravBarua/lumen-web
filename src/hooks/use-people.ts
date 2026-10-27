import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRooms } from '@/hooks/use-rooms';
import { membersKey, peopleKey } from '@/lib/query-keys';
import { listMembers } from '@/lib/rest';

export interface Person {
  id: string;
  username: string;
}

/** People you share a room with (the API has no user search), plus the people you have DMs with. */
export function usePeople(enabled: boolean) {
  const queryClient = useQueryClient();
  const rooms = useRooms();
  const roomIds = rooms.data?.map((r) => r.id).join(',') ?? '';

  return useQuery({
    queryKey: [...peopleKey, roomIds],
    enabled: enabled && !!rooms.data,
    // Memberships change while the app is open (people join), so rebuild the list whenever a dialog opens.
    staleTime: 0,
    gcTime: 0,
    queryFn: async (): Promise<Person[]> => {
      const list = rooms.data ?? [];
      const people = new Map<string, string>();
      for (const r of list)
        if (r.type === 'DM' && r.dmUser) people.set(r.dmUser.id, r.dmUser.username);
      const lists = await Promise.all(
        list
          .filter((r) => r.type !== 'DM')
          .map((r) =>
            queryClient.fetchQuery({
              queryKey: membersKey(r.id),
              queryFn: () => listMembers(r.id),
              staleTime: 0,
            }),
          ),
      );
      for (const m of lists.flat()) people.set(m.userId, m.username);
      return [...people]
        .map(([id, username]) => ({ id, username }))
        .sort((a, b) => a.username.localeCompare(b.username));
    },
  });
}
