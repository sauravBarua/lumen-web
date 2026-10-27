import { create } from 'zustand';
import type { Message } from '@/lib/types';

export type DialogState =
  | { type: 'create-room' }
  | { type: 'browse-rooms' }
  | { type: 'new-dm' }
  | { type: 'add-member'; roomId: string; roomName: string }
  | { type: 'delete-message'; roomId: string; message: Message }
  | { type: 'lightbox'; roomId: string; attachmentId: string };

export const useDialogStore = create<{
  dialog: DialogState | null;
  open: (dialog: DialogState) => void;
  close: () => void;
}>()((set) => ({
  dialog: null,
  open: (dialog) => set({ dialog }),
  close: () => set({ dialog: null }),
}));
