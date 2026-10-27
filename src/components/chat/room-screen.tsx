'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Lock } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ConnectionBanner } from '@/components/chat/connection-banner';
import { Composer } from '@/components/chat/composer';
import { MembersPanel } from '@/components/chat/members-panel';
import { MessageList } from '@/components/chat/message-list';
import type { MessageActions } from '@/components/chat/message-item';
import { RoomHeader } from '@/components/chat/room-header';
import { ErrorState } from '@/components/common/states';
import { MessageListSkeleton } from '@/components/ui/skeletons';
import { useChatActions } from '@/hooks/use-chat-actions';
import { useMessages } from '@/hooks/use-messages';
import { useRooms } from '@/hooks/use-rooms';
import { newestRealMessageId } from '@/lib/messages-cache';
import { roomsKey } from '@/lib/query-keys';
import { markRoomRead } from '@/lib/rest';
import { clearUnread } from '@/lib/rooms-cache';
import type { Message, Room } from '@/lib/types';
import { useDialogStore } from '@/stores/dialog-store';
import { useUiStore } from '@/stores/ui-store';

function RoomContent({ room }: { room: Room }) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const me = session?.user;
  const setActiveRoomId = useUiStore((s) => s.setActiveRoomId);
  const openDialog = useDialogStore((s) => s.open);
  const messages = useMessages(room.id);
  const actions = useChatActions(room.id);
  const [editing, setEditing] = useState<Message | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [unreadAtOpen] = useState(room.unreadCount);
  const lastMarked = useRef<string | null>(null);

  useEffect(() => {
    setActiveRoomId(room.id);
    try {
      localStorage.setItem('lumen-last-room', room.id);
    } catch {
      // Private mode: no "last room" memory.
    }
    return () => setActiveRoomId(null);
  }, [room.id, setActiveRoomId]);

  // Mark the room read once the newest message is on screen (and the tab is visible).
  const lastRealId = messages.messages.findLast((m) => !m.pending && !m.error)?.id ?? null;
  useEffect(() => {
    if (!atBottom || !lastRealId || lastMarked.current === lastRealId) return;
    if (document.visibilityState !== 'visible') return;
    const timer = setTimeout(() => {
      lastMarked.current = lastRealId;
      queryClient.setQueryData<Room[]>(roomsKey, (rooms) => rooms && clearUnread(rooms, room.id));
      void markRoomRead(room.id, lastRealId).catch(() => {
        lastMarked.current = null;
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [atBottom, lastRealId, room.id, queryClient]);

  const messageActions: MessageActions = useMemo(
    () => ({
      onEdit: (m) => setEditing(m),
      onDelete: (m) => openDialog({ type: 'delete-message', roomId: room.id, message: m }),
      onReact: (m, emoji) => void actions.react(m, emoji),
      onRetry: actions.retry,
      onDiscard: actions.discard,
      onOpenImage: (attachmentId) =>
        openDialog({ type: 'lightbox', roomId: room.id, attachmentId }),
    }),
    [actions, openDialog, room.id],
  );

  const loadOlder = useCallback(() => void messages.loadOlder(), [messages]);
  const isDm = room.type === 'DM';
  const label = isDm ? `@${room.dmUser?.username ?? ''}` : `#${room.name}`;
  const canModerate = room.myRole === 'OWNER' || room.myRole === 'ADMIN';

  if (!me) return null;
  const newest = newestRealMessageId(undefined);
  void newest;

  return (
    <>
      <div className="flex min-w-0 flex-1 flex-col">
        <ConnectionBanner />
        <RoomHeader room={room} />
        <MessageList
          roomLabel={label}
          messages={messages.messages}
          meId={me.id}
          meUsername={me.username}
          canModerate={canModerate}
          unreadAtOpen={unreadAtOpen}
          loading={messages.isPending}
          error={messages.isError}
          onRetry={() => void messages.refetch()}
          hasOlder={messages.hasOlder}
          loadingOlder={messages.loadingOlder}
          onLoadOlder={loadOlder}
          onAtBottomChange={setAtBottom}
          actions={messageActions}
        />
        <Composer
          key={`${room.id}:${editing?.id ?? 'new'}`}
          roomId={room.id}
          roomLabel={label}
          actions={actions}
          editing={editing}
          onCancelEdit={() => setEditing(null)}
          meId={me.id}
        />
      </div>
      {!isDm && <MembersPanel room={room} meId={me.id} />}
    </>
  );
}

export function RoomScreen({ roomId }: { roomId: string }) {
  const rooms = useRooms();
  const room = rooms.data?.find((r) => r.id === roomId);

  if (rooms.isPending) {
    return (
      <div className="flex min-w-0 flex-1 flex-col">
        <RoomHeader room={null} />
        <MessageListSkeleton />
      </div>
    );
  }
  if (rooms.isError) {
    return (
      <div className="flex min-w-0 flex-1 flex-col">
        <RoomHeader room={null} />
        <ErrorState
          title="Couldn't load this room"
          description="Check your connection and try again."
          onRetry={() => void rooms.refetch()}
        />
      </div>
    );
  }
  if (!room) {
    return (
      <div className="flex min-w-0 flex-1 flex-col">
        <RoomHeader room={null} />
        <ErrorState
          icon={Lock}
          tone="muted"
          title="Room not found"
          description="It may have been deleted, or you don't have permission to view it."
        >
          <Link
            href="/rooms"
            className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Back to your rooms
          </Link>
        </ErrorState>
      </div>
    );
  }
  return <RoomContent key={room.id} room={room} />;
}
