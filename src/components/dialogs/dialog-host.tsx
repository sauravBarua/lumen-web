'use client';

import { AddMemberDialog } from '@/components/dialogs/add-member-dialog';
import { BrowseRoomsDialog } from '@/components/dialogs/browse-rooms-dialog';
import { CreateRoomDialog } from '@/components/dialogs/create-room-dialog';
import { DeleteMessageDialog } from '@/components/dialogs/delete-message-dialog';
import { Lightbox } from '@/components/dialogs/lightbox';
import { NewDmDialog } from '@/components/dialogs/new-dm-dialog';
import { useDialogStore } from '@/stores/dialog-store';

/** Renders whichever dialog is open. Mounted once, inside the providers. */
export function DialogHost() {
  const dialog = useDialogStore((s) => s.dialog);
  const close = useDialogStore((s) => s.close);
  if (!dialog) return null;

  switch (dialog.type) {
    case 'create-room':
      return <CreateRoomDialog onClose={close} />;
    case 'browse-rooms':
      return <BrowseRoomsDialog onClose={close} />;
    case 'new-dm':
      return <NewDmDialog onClose={close} />;
    case 'add-member':
      return <AddMemberDialog roomId={dialog.roomId} roomName={dialog.roomName} onClose={close} />;
    case 'delete-message':
      return (
        <DeleteMessageDialog roomId={dialog.roomId} message={dialog.message} onClose={close} />
      );
    case 'lightbox':
      return <Lightbox roomId={dialog.roomId} attachmentId={dialog.attachmentId} onClose={close} />;
  }
}
