import { create } from 'zustand';
import type { PresenceItem, PresenceStatus } from '@/lib/types';

interface Entry {
  status: PresenceStatus;
  lastSeenAt: string | null;
}

interface PresenceState {
  byUser: Record<string, Entry>;
  seed: (items: PresenceItem[]) => void;
  set: (userId: string, status: PresenceStatus, lastSeenAt: string | null) => void;
}

export const usePresenceStore = create<PresenceState>()((set) => ({
  byUser: {},
  seed: (items) =>
    set((s) => ({
      byUser: {
        ...s.byUser,
        ...Object.fromEntries(
          items.map((i) => [i.userId, { status: i.status, lastSeenAt: i.lastSeenAt }]),
        ),
      },
    })),
  set: (userId, status, lastSeenAt) =>
    set((s) => ({ byUser: { ...s.byUser, [userId]: { status, lastSeenAt } } })),
}));
