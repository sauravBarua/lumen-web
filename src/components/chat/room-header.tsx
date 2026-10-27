'use client';

import { Hash, Lock, Menu, Users } from 'lucide-react';
import { Avatar } from '@/components/common/avatar';
import { NotificationBell } from '@/components/notifications/notification-bell';
import type { Room } from '@/lib/types';
import { usePresenceStore } from '@/stores/presence-store';
import { useUiStore } from '@/stores/ui-store';

export function RoomHeader({ room }: { room: Room | null }) {
  const setRoomsDrawerOpen = useUiStore((s) => s.setRoomsDrawerOpen);
  const toggleMembers = useUiStore((s) => s.toggleMembers);
  const dmPresence = usePresenceStore((s) =>
    room?.dmUser ? s.byUser[room.dmUser.id]?.status : undefined,
  );
  const isDm = room?.type === 'DM';

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-3 sm:px-4">
      <button
        type="button"
        onClick={() => setRoomsDrawerOpen(true)}
        aria-label="Open rooms"
        className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        {room && isDm && room.dmUser ? (
          <>
            <Avatar
              name={room.dmUser.username}
              size="md"
              presence={dmPresence ?? 'offline'}
              ring="ring-background"
            />
            <h1 className="truncate text-base font-semibold">{room.dmUser.username}</h1>
          </>
        ) : room ? (
          <>
            {room.type === 'PRIVATE' ? (
              <Lock className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            ) : (
              <Hash className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            )}
            <h1 className="truncate text-base font-semibold">{room.name}</h1>
            {room.description && (
              <>
                <span className="hidden h-4 w-px bg-border sm:block" />
                <p className="hidden truncate text-sm text-muted-foreground sm:block">
                  {room.description}
                </p>
              </>
            )}
          </>
        ) : (
          <h1 className="text-base font-semibold">Lumen</h1>
        )}
      </div>

      {room && !isDm && (
        <button
          type="button"
          onClick={() => toggleMembers(window.matchMedia('(min-width:1024px)').matches)}
          aria-label={`Show members, ${room.memberCount}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Users className="size-4" aria-hidden="true" />
          {room.memberCount}
        </button>
      )}
      <NotificationBell />
    </header>
  );
}
