import { CircleAlert, FileText, X } from 'lucide-react';
import { formatFileSize } from '@/lib/format';

export interface UploadItem {
  id: string;
  file: File;
  status: 'ready' | 'uploading' | 'error';
  progress: number;
  error?: string;
}

export function UploadChip({ item, onRemove }: { item: UploadItem; onRemove: () => void }) {
  const failed = item.status === 'error';
  return (
    <div
      role={failed ? 'alert' : undefined}
      className={
        failed
          ? 'flex w-full max-w-xs items-center gap-2.5 rounded-md border border-destructive/50 bg-destructive/10 p-2'
          : 'flex w-full max-w-xs items-center gap-2.5 rounded-md border border-border bg-background p-2'
      }
    >
      <span
        className={
          failed
            ? 'grid size-8 shrink-0 place-items-center rounded bg-destructive/15 text-destructive'
            : 'grid size-8 shrink-0 place-items-center rounded bg-accent text-accent-foreground'
        }
      >
        {failed ? (
          <CircleAlert className="size-4" aria-hidden="true" />
        ) : (
          <FileText className="size-4" aria-hidden="true" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">
          {item.file.name}{' '}
          {!failed && (
            <span className="font-normal text-muted-foreground">
              · {formatFileSize(item.file.size)}
            </span>
          )}
        </p>
        {failed ? (
          <p className="text-xs text-destructive">{item.error}</p>
        ) : item.status === 'uploading' ? (
          <div
            className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label={`Uploading ${item.file.name}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={item.progress}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${item.progress}%` }}
            />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Ready to send</p>
        )}
      </div>
      {item.status !== 'uploading' && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={failed ? `Dismiss ${item.file.name} error` : `Remove ${item.file.name}`}
          className="inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
