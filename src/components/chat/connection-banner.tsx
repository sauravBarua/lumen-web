'use client';

import { CircleAlert, LoaderCircle } from 'lucide-react';
import Link from 'next/link';
import { useConnectionStore } from '@/stores/connection-store';

export function ConnectionBanner() {
  const status = useConnectionStore((s) => s.status);
  if (status === 'connected') return null;
  if (status === 'reconnecting') {
    return (
      <div
        role="status"
        className="flex items-center justify-center gap-2 border-b border-warning/40 bg-warning/15 px-4 py-2 text-sm"
      >
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        Reconnecting…
      </div>
    );
  }
  if (status === 'lost') {
    return (
      <div
        role="alert"
        className="flex items-center justify-center gap-2 border-b border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive"
      >
        <CircleAlert className="size-4" aria-hidden="true" />
        Connection lost. Retrying<span className="animate-pulse">…</span>
      </div>
    );
  }
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive"
    >
      <span className="flex items-center gap-2">
        <CircleAlert className="size-4" aria-hidden="true" />
        Session expired. Sign in again
      </span>
      <Link
        href="/login?reason=session_expired"
        className="rounded-md bg-destructive px-2.5 py-1 text-xs font-medium text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Sign in
      </Link>
    </div>
  );
}
