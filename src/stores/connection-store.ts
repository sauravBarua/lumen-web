import { create } from 'zustand';

export type ConnectionStatus = 'connected' | 'reconnecting' | 'lost' | 'expired';

export const useConnectionStore = create<{
  status: ConnectionStatus;
  set: (status: ConnectionStatus) => void;
}>()((set) => ({ status: 'connected', set: (status) => set({ status }) }));
