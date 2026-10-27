import { useEffect } from 'react';
import type { AppSocket } from '@/lib/socket';
import { useUiStore } from '@/stores/ui-store';

const INTERVAL_MS = 25_000;
const IDLE_MS = 5 * 60_000;

/** Tells the server this connection is alive, and whether the user is active (online) or idle (away). */
export function useHeartbeat(socket: AppSocket | null) {
  useEffect(() => {
    if (!socket) return;
    let lastActivity = Date.now();
    const touch = () => {
      lastActivity = Date.now();
    };
    const beat = () => {
      if (!socket.connected) return;
      const active =
        !useUiStore.getState().manualAway &&
        document.visibilityState === 'visible' &&
        Date.now() - lastActivity < IDLE_MS;
      socket.emit('presence:heartbeat', { active }, () => undefined);
    };

    const activityEvents = ['pointerdown', 'keydown', 'scroll'] as const;
    activityEvents.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    document.addEventListener('visibilitychange', beat);
    socket.on('connect', beat);
    const timer = setInterval(beat, INTERVAL_MS);
    const unsubscribe = useUiStore.subscribe((s, prev) => {
      if (s.manualAway !== prev.manualAway) beat();
    });

    return () => {
      activityEvents.forEach((e) => window.removeEventListener(e, touch));
      document.removeEventListener('visibilitychange', beat);
      socket.off('connect', beat);
      clearInterval(timer);
      unsubscribe();
    };
  }, [socket]);
}
