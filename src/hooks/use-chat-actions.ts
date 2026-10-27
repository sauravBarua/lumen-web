import { useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useCallback, useMemo } from 'react';
import { useSocket } from '@/components/realtime-provider';
import { uid } from '@/lib/ids';
import {
  addPending,
  applyDelete,
  failPending,
  removeMessage,
  replacePending,
  retryPending,
  upsertMessage,
} from '@/lib/messages-cache';
import { messagesKey } from '@/lib/query-keys';
import { emitAck } from '@/lib/socket';
import type { AckError } from '@/lib/socket-events';
import type { Message, MessagesData } from '@/lib/types';
import { toast } from '@/stores/toast-store';
import { useUiStore } from '@/stores/ui-store';

const NOT_CONNECTED = 'Not connected. Check your connection and try again.';

function describe(error: AckError): string {
  switch (error.code) {
    case 'RATE_LIMITED':
      return "You're sending messages too fast, slow down.";
    case 'UNAUTHORIZED':
      return 'Your session expired. Reconnecting…';
    case 'FORBIDDEN':
    case 'NOT_FOUND':
      return error.message;
    default:
      return 'Something went wrong. Please try again.';
  }
}

export interface ChatActions {
  send: (content: string, retryTempId?: string) => Promise<void>;
  retry: (message: Message) => void;
  discard: (message: Message) => void;
  edit: (messageId: string, content: string) => Promise<boolean>;
  remove: (messageId: string) => Promise<boolean>;
  react: (message: Message, emoji: string) => Promise<void>;
  receive: (message: Message) => void;
}

/** All message mutations of one room: optimistic send, edit, delete, reactions. */
export function useChatActions(roomId: string): ChatActions {
  const queryClient = useQueryClient();
  const socket = useSocket();
  const { data: session } = useSession();
  const me = session?.user;
  const key = messagesKey(roomId);

  const update = useCallback(
    (fn: (data: MessagesData) => MessagesData): void => {
      queryClient.setQueryData<MessagesData>(key, (old) => old && fn(old));
    },
    [queryClient, key],
  );

  const send = useCallback(
    async (content: string, retryTempId?: string) => {
      if (!me) return;
      const tempId = retryTempId ?? `pending-${uid()}`;
      if (retryTempId) update((d) => retryPending(d, tempId));
      else {
        update((d) =>
          addPending(d, {
            id: tempId,
            roomId,
            sender: { id: me.id, username: me.username },
            content,
            createdAt: new Date().toISOString(),
            editedAt: null,
            deletedAt: null,
            reactions: [],
            attachments: [],
            pending: true,
          }),
        );
      }
      const fail = (error: string) => update((d) => failPending(d, tempId, error));
      if (!socket?.connected) return fail(NOT_CONNECTED);
      try {
        const ack = await emitAck<Message>(socket, 'message:send', { roomId, content });
        if (ack.ok) update((d) => replacePending(d, tempId, ack.data));
        else {
          if (ack.error.code === 'RATE_LIMITED') useUiStore.getState().triggerRateLimit();
          fail(describe(ack.error));
        }
      } catch {
        fail('No answer from the server. Try again.');
      }
    },
    [me, roomId, socket, update],
  );

  const retry = useCallback((m: Message) => void send(m.content ?? '', m.id), [send]);
  const discard = useCallback((m: Message) => update((d) => removeMessage(d, m.id)), [update]);

  const edit = useCallback(
    async (messageId: string, content: string) => {
      if (!socket?.connected) {
        toast.error('Message not edited', NOT_CONNECTED);
        return false;
      }
      try {
        const ack = await emitAck<Message>(socket, 'message:edit', { roomId, messageId, content });
        if (!ack.ok) {
          toast.error('Message not edited', describe(ack.error));
          return false;
        }
        update((d) => upsertMessage(d, ack.data));
        return true;
      } catch {
        toast.error('Message not edited', 'No answer from the server.');
        return false;
      }
    },
    [roomId, socket, update],
  );

  const remove = useCallback(
    async (messageId: string) => {
      if (!socket?.connected) {
        toast.error('Message not deleted', NOT_CONNECTED);
        return false;
      }
      try {
        const ack = await emitAck<null>(socket, 'message:delete', { roomId, messageId });
        if (!ack.ok) {
          toast.error('Message not deleted', describe(ack.error));
          return false;
        }
        update((d) => applyDelete(d, messageId, new Date().toISOString()));
        return true;
      } catch {
        toast.error('Message not deleted', 'No answer from the server.');
        return false;
      }
    },
    [roomId, socket, update],
  );

  const react = useCallback(
    async (message: Message, emoji: string) => {
      if (!socket?.connected) return;
      const mine = message.reactions.find((r) => r.emoji === emoji)?.reactedByMe ?? false;
      try {
        const ack = await emitAck<Message>(socket, 'message:react', {
          roomId,
          messageId: message.id,
          emoji,
          action: mine ? 'remove' : 'add',
        });
        if (ack.ok) update((d) => upsertMessage(d, ack.data));
        else toast.error('Reaction not saved', describe(ack.error));
      } catch {
        toast.error('Reaction not saved', 'No answer from the server.');
      }
    },
    [roomId, socket, update],
  );

  const receive = useCallback((m: Message) => update((d) => upsertMessage(d, m)), [update]);

  return useMemo(
    () => ({ send, retry, discard, edit, remove, react, receive }),
    [send, retry, discard, edit, remove, react, receive],
  );
}
