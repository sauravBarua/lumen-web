'use client';

import { CircleCheck, CircleX, Info, X } from 'lucide-react';
import { useToastStore } from '@/stores/toast-store';
import { cn } from '@/lib/utils';

const ICON = {
  success: <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />,
  error: <CircleX className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />,
  info: <Info className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />,
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:items-end"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.tone === 'error' ? 'alert' : 'status'}
          className={cn(
            'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border bg-popover p-4 text-popover-foreground shadow-md',
            t.tone === 'error' ? 'border-destructive/40' : 'border-border',
          )}
        >
          {ICON[t.tone]}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{t.title}</p>
            {t.description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{t.description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss notification"
            className="inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
