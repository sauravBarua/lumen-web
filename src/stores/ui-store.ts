import { create } from 'zustand';

interface UiState {
  roomsDrawerOpen: boolean;
  membersMobileOpen: boolean;
  membersCollapsed: boolean;
  manualAway: boolean;
  rateLimited: boolean;
  activeRoomId: string | null;
  setRoomsDrawerOpen: (open: boolean) => void;
  setMembersMobileOpen: (open: boolean) => void;
  toggleMembers: (desktop: boolean) => void;
  closeDrawers: () => void;
  setManualAway: (away: boolean) => void;
  triggerRateLimit: () => void;
  setActiveRoomId: (id: string | null) => void;
}

let rateLimitTimer: ReturnType<typeof setTimeout> | undefined;

export const useUiStore = create<UiState>()((set) => ({
  roomsDrawerOpen: false,
  membersMobileOpen: false,
  membersCollapsed: false,
  manualAway: false,
  rateLimited: false,
  activeRoomId: null,
  setRoomsDrawerOpen: (open) => set({ roomsDrawerOpen: open }),
  setMembersMobileOpen: (open) => set({ membersMobileOpen: open }),
  toggleMembers: (desktop) =>
    set((s) =>
      desktop
        ? { membersCollapsed: !s.membersCollapsed }
        : { membersMobileOpen: !s.membersMobileOpen },
    ),
  closeDrawers: () => set({ roomsDrawerOpen: false, membersMobileOpen: false }),
  setManualAway: (away) => set({ manualAway: away }),
  triggerRateLimit: () => {
    set({ rateLimited: true });
    clearTimeout(rateLimitTimer);
    rateLimitTimer = setTimeout(() => set({ rateLimited: false }), 5000);
  },
  setActiveRoomId: (id) => set({ activeRoomId: id }),
}));
