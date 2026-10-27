'use client';

import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useChatActions } from '@/hooks/use-chat-actions';
import { formatTime } from '@/lib/format';
import type { Message } from '@/lib/types';

export function DeleteMessageDialog({
  roomId,
  message,
  onClose,
}: {
  roomId: string;
  message: Message;
  onClose: () => void;
}) {
  const actions = useChatActions(roomId);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    const ok = await actions.remove(message.id);
    setBusy(false);
    if (ok) onClose();
  }

  return (
    <Modal
      role="alertdialog"
      onClose={onClose}
      labelledBy="del-title"
      describedBy="del-desc"
      className="max-w-sm"
    >
      <div className="flex gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive">
          <Trash2 className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h3 id="del-title" className="text-lg font-semibold">
            Delete this message?
          </h3>
          <p id="del-desc" className="mt-1 text-sm text-muted-foreground">
            This can&apos;t be undone. Everyone in the room will see &ldquo;This message was
            deleted&rdquo;.
          </p>
        </div>
      </div>
      <blockquote
        data-message-id={message.id}
        className="mt-4 rounded-md border-l-2 border-border bg-muted px-3 py-2 text-sm text-muted-foreground"
      >
        <span className="font-medium text-foreground">{message.sender.username}</span> ·{' '}
        {formatTime(message.createdAt)}
        <br />
        <span className="line-clamp-3 whitespace-pre-wrap break-words">
          {message.content || 'Attachment'}
        </span>
      </blockquote>
      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} data-autofocus>
          Cancel
        </Button>
        <Button
          type="button"
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          loading={busy}
          onClick={() => void confirm()}
        >
          Delete
        </Button>
      </div>
    </Modal>
  );
}
