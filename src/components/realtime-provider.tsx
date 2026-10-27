'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useMemo } from 'react';
import { useHeartbeat } from '@/hooks/use-heartbeat';
import { attachRealtimeHandlers } from '@/lib/realtime/handlers';
import { type AppSocket, createSocket } from '@/lib/socket';
import { toast } from '@/stores/toast-store';
import { useUiStore } from '@/stores/ui-store';

const SocketContext = createContext<AppSocket | null>(null);

export const useSocket = () => useContext(SocketContext);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: session } = useSession();
  const meId = session?.user.id;

  // Creating the socket does not connect it; the effect below does.
  const socket = useMemo(() => (meId ? createSocket() : null), [meId]);

  useEffect(() => {
    if (!socket || !meId) return;
    const detach = attachRealtimeHandlers(socket, {
      queryClient,
      meId,
      onRoomRemoved: (roomId) => {
        if (useUiStore.getState().activeRoomId === roomId) {
          toast.info('You were removed from this room');
          router.replace('/rooms');
        }
      },
    });
    socket.connect();
    return () => {
      detach();
      socket.disconnect();
    };
  }, [socket, meId, queryClient, router]);

  useHeartbeat(socket);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}
