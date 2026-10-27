import { useQuery } from '@tanstack/react-query';
import { roomsKey } from '@/lib/query-keys';
import { listRooms } from '@/lib/rest';

export function useRooms() {
  return useQuery({ queryKey: roomsKey, queryFn: listRooms, staleTime: 30_000 });
}
