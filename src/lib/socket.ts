import { io, type Socket } from 'socket.io-client';
import { env } from '@/env';
import { getAccessToken } from '@/lib/api/browser';
import type { Ack, ClientToServerEvents, ServerToClientEvents } from '@/lib/socket-events';

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function createSocket(): AppSocket {
  return io(env.NEXT_PUBLIC_API_URL, {
    autoConnect: false,
    transports: ['websocket'],
    // Evaluated on every (re)connection attempt, so a reconnect always carries a fresh token.
    auth: (cb) => {
      void getAccessToken().then((token) => cb({ token: token ?? '' }));
    },
  });
}

/** Emits an event that answers with an ack. Rejects after 8 s without an answer. */
export function emitAck<T>(
  socket: AppSocket,
  event: keyof ClientToServerEvents,
  payload: unknown,
): Promise<Ack<T>> {
  // The generic emit typing cannot express "any acked event" without a cast.
  const withTimeout = socket.timeout(8000) as unknown as {
    emitWithAck(event: string, payload: unknown): Promise<Ack<T>>;
  };
  return withTimeout.emitWithAck(event, payload);
}
