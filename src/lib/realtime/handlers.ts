import type { QueryClient } from '@tanstack/react-query';
import {
  applyDelete,
  applyEdit,
  applyReaction,
  newestRealMessageId,
  removePendingMatching,
  upsertMessage,
} from '@/lib/messages-cache';
import { notificationTitle } from '@/lib/notification-text';
import { membersKey, messagesKey, notificationCountKey, roomsKey } from '@/lib/query-keys';
import { bumpUnread } from '@/lib/rooms-cache';
import { type AppSocket, emitAck } from '@/lib/socket';
import type { MessagesPageDto } from '@/lib/socket-events';
import type { Member, MessagesData, Room } from '@/lib/types';
import { useConnectionStore } from '@/stores/connection-store';
import { usePresenceStore } from '@/stores/presence-store';
import { toast } from '@/stores/toast-store';
import { useTypingStore } from '@/stores/typing-store';
import { useUiStore } from '@/stores/ui-store';

interface Context {
  queryClient: QueryClient;
  meId: string;
  onRoomRemoved: (roomId: string) => void;
}

/** Connects every server event to the caches and stores. Returns a cleanup function. */
export function attachRealtimeHandlers(socket: AppSocket, ctx: Context): () => void {
  const { queryClient: qc, meId } = ctx;
  const connection = () => useConnectionStore.getState();
  let everConnected = false;
  let authFailures = 0;
  let lostTimer: ReturnType<typeof setTimeout> | undefined;
  const timers: ReturnType<typeof setTimeout>[] = [];

  const markReconnecting = () => {
    if (connection().status === 'expired') return;
    connection().set('reconnecting');
    clearTimeout(lostTimer);
    lostTimer = setTimeout(() => connection().set('lost'), 10_000);
  };

  async function syncRoom(roomId: string) {
    const after = newestRealMessageId(qc.getQueryData<MessagesData>(messagesKey(roomId)));
    if (!after) return;
    try {
      const ack = await emitAck<MessagesPageDto>(socket, 'messages:sync', {
        roomId,
        after,
        limit: 100,
      });
      if (!ack.ok) return;
      qc.setQueryData<MessagesData>(
        messagesKey(roomId),
        (old) => old && ack.data.items.reduce<MessagesData>((acc, m) => upsertMessage(acc, m), old),
      );
      if (ack.data.nextCursor) void qc.invalidateQueries({ queryKey: messagesKey(roomId) });
    } catch {
      // The next reconnect retries.
    }
  }

  function resync() {
    void qc.invalidateQueries({ queryKey: ['messages'], refetchType: 'none' });
    void qc.invalidateQueries({ queryKey: roomsKey });
    void qc.invalidateQueries({ queryKey: notificationCountKey });
    void qc.invalidateQueries({ queryKey: ['notifications'] });
    void qc.invalidateQueries({ queryKey: ['members'] });
    const active = useUiStore.getState().activeRoomId;
    if (active) void syncRoom(active);
  }

  socket.on('connect', () => {
    clearTimeout(lostTimer);
    authFailures = 0;
    connection().set('connected');
    if (everConnected) resync();
    everConnected = true;
  });

  socket.on('disconnect', (reason) => {
    markReconnecting();
    // Socket.IO does not reconnect after a server-side disconnect (expired token, deployment): do it ourselves.
    if (reason === 'io server disconnect') timers.push(setTimeout(() => socket.connect(), 500));
  });

  socket.on('connect_error', (err) => {
    if (err.message !== 'Unauthorized') {
      markReconnecting(); // network problem: Socket.IO retries by itself
      return;
    }
    authFailures += 1;
    if (authFailures > 3) {
      clearTimeout(lostTimer);
      connection().set('expired');
      return;
    }
    timers.push(setTimeout(() => socket.connect(), 1000 * authFailures));
  });

  socket.on('message:new', (m) => {
    qc.setQueryData<MessagesData>(messagesKey(m.roomId), (old) => {
      if (!old) return old;
      const cleaned = m.sender.id === meId ? removePendingMatching(old, m.content ?? '') : old;
      return upsertMessage(cleaned, m);
    });
    if (m.sender.id !== meId) {
      qc.setQueryData<Room[]>(roomsKey, (rooms) => rooms && bumpUnread(rooms, m.roomId));
    }
    // A new voice in the room: the member list and presence we hold for it are out of date.
    const members = qc.getQueryData<Member[]>(membersKey(m.roomId));
    if (members && !members.some((x) => x.userId === m.sender.id)) {
      void qc.invalidateQueries({ queryKey: membersKey(m.roomId) });
      void qc.invalidateQueries({ queryKey: ['room-presence', m.roomId] });
    }
  });

  socket.on('message:edited', (e) =>
    qc.setQueryData<MessagesData>(
      messagesKey(e.roomId),
      (old) => old && applyEdit(old, e.messageId, e.content, e.editedAt),
    ),
  );

  socket.on('message:deleted', (e) =>
    qc.setQueryData<MessagesData>(
      messagesKey(e.roomId),
      (old) => old && applyDelete(old, e.messageId, new Date().toISOString()),
    ),
  );

  socket.on('message:reaction', (e) =>
    qc.setQueryData<MessagesData>(
      messagesKey(e.roomId),
      (old) => old && applyReaction(old, e, meId),
    ),
  );

  socket.on('typing', (e) => {
    if (e.userId !== meId)
      useTypingStore.getState().setTyping(e.roomId, e.userId, e.username, e.isTyping);
  });

  socket.on('presence:changed', (e) =>
    usePresenceStore.getState().set(e.userId, e.status, e.lastSeenAt),
  );

  socket.on('notification:new', (e) => {
    qc.setQueryData(notificationCountKey, e.unreadCount);
    void qc.invalidateQueries({ queryKey: ['notifications'] });
    if (e.notification.roomId !== useUiStore.getState().activeRoomId) {
      toast.info(notificationTitle(e.notification), e.notification.preview ?? undefined);
    }
  });

  socket.on('notification:read', (e) => {
    qc.setQueryData(notificationCountKey, e.unreadCount);
    void qc.invalidateQueries({ queryKey: ['notifications'] });
  });

  socket.on('room:added', () => void qc.invalidateQueries({ queryKey: roomsKey }));

  socket.on('room:removed', (e) => {
    void qc.invalidateQueries({ queryKey: roomsKey });
    qc.removeQueries({ queryKey: membersKey(e.roomId) });
    ctx.onRoomRemoved(e.roomId);
  });

  return () => {
    clearTimeout(lostTimer);
    timers.forEach(clearTimeout);
    socket.removeAllListeners();
  };
}
