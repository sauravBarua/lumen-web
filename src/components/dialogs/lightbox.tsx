'use client';

import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Download, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { attachmentName, isImage } from '@/lib/files';
import { formatDayLabel, formatFileSize, formatTime } from '@/lib/format';
import { flattenMessages } from '@/lib/messages-cache';
import { messagesKey } from '@/lib/query-keys';
import type { AttachmentDto } from '@/lib/socket-events';
import type { Message, MessagesData } from '@/lib/types';

interface GalleryItem {
  message: Message;
  attachment: AttachmentDto;
}

export function Lightbox({
  roomId,
  attachmentId,
  onClose,
}: {
  roomId: string;
  attachmentId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  // Snapshot of the images loaded in this room when the viewer opens.
  const [gallery] = useState<GalleryItem[]>(() => {
    const data = queryClient.getQueryData<MessagesData>(messagesKey(roomId));
    return (data ? flattenMessages(data) : []).flatMap((message) =>
      message.attachments
        .filter((a) => isImage(a.mime))
        .map((attachment) => ({ message, attachment })),
    );
  });
  const [index, setIndex] = useState(() =>
    Math.max(
      0,
      gallery.findIndex((g) => g.attachment.id === attachmentId),
    ),
  );
  const current = gallery[index];

  useEffect(() => {
    if (!current) onClose();
  }, [current, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(gallery.length - 1, i + 1));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [gallery.length]);

  if (!current) return null;
  const { message, attachment } = current;
  const name = attachmentName(attachment.url, attachment.mime);

  return (
    <Modal
      onClose={onClose}
      labelledBy="lightbox-title"
      className="max-w-3xl overflow-hidden border-neutral-800 bg-neutral-950 p-0 text-neutral-50"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <h3 id="lightbox-title" className="truncate text-sm font-medium">
            {name}
          </h3>
          <p className="text-xs text-neutral-300">
            {message.sender.username} · {formatDayLabel(message.createdAt)},{' '}
            {formatTime(message.createdAt)} · {formatFileSize(attachment.size)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <a
            href={attachment.url}
            download
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Download image"
            className="inline-flex size-9 items-center justify-center rounded-md text-neutral-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Download className="size-4" aria-hidden="true" />
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="inline-flex size-9 items-center justify-center rounded-md text-neutral-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="relative grid place-items-center bg-black/40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={attachment.url} alt={name} className="max-h-[70vh] w-full object-contain" />
        {index > 0 && (
          <button
            type="button"
            onClick={() => setIndex(index - 1)}
            aria-label="Previous image"
            className="absolute left-3 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
        )}
        {index < gallery.length - 1 && (
          <button
            type="button"
            onClick={() => setIndex(index + 1)}
            aria-label="Next image"
            className="absolute right-3 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        )}
      </div>
      <p className="px-4 py-2 text-center text-xs text-neutral-300">
        {index + 1} of {gallery.length} {gallery.length === 1 ? 'image' : 'images'} in this room
      </p>
    </Modal>
  );
}
