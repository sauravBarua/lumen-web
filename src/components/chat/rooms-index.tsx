'use client';

import { Hash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ConnectionBanner } from '@/components/chat/connection-banner';
import { RoomHeader } from '@/components/chat/room-header';
import { EmptyState, ErrorState } from '@/components/common/states';
import { Button } from '@/components/ui/button';
import { MessageListSkeleton } from '@/components/ui/skeletons';
import { useRooms } from '@/hooks/use-rooms';
import { useDialogStore } from '@/stores/dialog-store';

/** /rooms: sends you to your last room, or invites you to create or join one. */
export function RoomsIndex() {
  const router = useRouter();
  const rooms = useRooms();
  const open = useDialogStore((s) => s.open);

  useEffect(() => {
    const list = rooms.data;
    if (!list?.length) return;
    let last: string | null = null;
    try {
      last = localStorage.getItem('lumen-last-room');
    } catch {
      // no memory of the last room
    }
    const target = list.find((r) => r.id === last) ?? list.find((r) => r.type !== 'DM') ?? list[0];
    router.replace(`/rooms/${target.id}`);
  }, [rooms.data, router]);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <ConnectionBanner />
      <RoomHeader room={null} />
      {rooms.isError ? (
        <ErrorState title="Couldn't load your rooms" onRetry={() => void rooms.refetch()} />
      ) : rooms.isPending || rooms.data.length > 0 ? (
        <MessageListSkeleton />
      ) : (
        <EmptyState
          icon={Hash}
          title="No rooms yet"
          description="Create a room or browse public ones to start chatting."
        >
          <Button size="sm" onClick={() => open({ type: 'create-room' })}>
            New room
          </Button>
          <Button size="sm" variant="outline" onClick={() => open({ type: 'browse-rooms' })}>
            Browse
          </Button>
        </EmptyState>
      )}
    </div>
  );
}
