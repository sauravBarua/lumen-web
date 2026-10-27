import { create } from 'zustand';

interface TypingState {
  /** roomId -> userId -> username of the people currently typing. */
  byRoom: Record<string, Record<string, string>>;
  setTyping: (roomId: string, userId: string, username: string, isTyping: boolean) => void;
}

const timers = new Map<string, ReturnType<typeof setTimeout>>();
const SAFETY_EXPIRY_MS = 6000; // the server sends "stopped" after 5 s; this only covers a lost connection

export const useTypingStore = create<TypingState>()((set, get) => ({
  byRoom: {},
  setTyping: (roomId, userId, username, isTyping) => {
    const key = `${roomId}:${userId}`;
    clearTimeout(timers.get(key));
    timers.delete(key);
    set((s) => {
      const room = { ...(s.byRoom[roomId] ?? {}) };
      if (isTyping) room[userId] = username;
      else delete room[userId];
      return { byRoom: { ...s.byRoom, [roomId]: room } };
    });
    if (isTyping) {
      timers.set(
        key,
        setTimeout(() => get().setTyping(roomId, userId, username, false), SAFETY_EXPIRY_MS),
      );
    }
  },
}));
