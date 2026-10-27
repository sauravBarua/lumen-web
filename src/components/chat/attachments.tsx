import { Download, FileText, Image as ImageIcon } from 'lucide-react';
import { attachmentName, isImage, mimeLabel } from '@/lib/files';
import { formatFileSize } from '@/lib/format';
import type { AttachmentDto } from '@/lib/socket-events';

export function Attachments({
  attachments,
  onOpenImage,
}: {
  attachments: AttachmentDto[];
  onOpenImage: (attachmentId: string) => void;
}) {
  return (
    <>
      {attachments.map((a) =>
        isImage(a.mime) ? (
          <figure
            key={a.id}
            className="mt-2 w-full max-w-sm"
            data-attachment-mime={a.mime}
            data-attachment-size={a.size}
          >
            <button
              type="button"
              onClick={() => onOpenImage(a.id)}
              aria-label="Open image in viewer"
              className="group/img block w-full overflow-hidden rounded-lg border border-border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={a.url}
                alt={attachmentName(a.url, a.mime)}
                loading="lazy"
                className="max-h-72 w-full object-cover transition-transform group-hover/img:scale-[1.02]"
              />
            </button>
            <figcaption className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <ImageIcon className="size-3" aria-hidden="true" />
              {mimeLabel(a.mime)} · {formatFileSize(a.size)}
            </figcaption>
          </figure>
        ) : (
          <div
            key={a.id}
            className="mt-2 flex w-full max-w-sm items-center gap-3 rounded-lg border border-border bg-card p-3"
            data-attachment-mime={a.mime}
            data-attachment-size={a.size}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground">
              <FileText className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{attachmentName(a.url, a.mime)}</p>
              <p className="text-xs text-muted-foreground">
                {mimeLabel(a.mime)} · {formatFileSize(a.size)}
              </p>
            </div>
            <a
              href={a.url}
              download
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Download ${attachmentName(a.url, a.mime)}`}
              className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Download className="size-4" aria-hidden="true" />
            </a>
          </div>
        ),
      )}
    </>
  );
}
