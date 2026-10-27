import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="relative w-full max-w-lg overflow-hidden rounded-lg border border-border bg-card">
        <div className="pointer-events-none absolute left-1/2 top-0 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col items-center px-6 py-16 text-center">
          <span className="grid size-12 place-items-center rounded-xl bg-primary">
            <span className="size-3.5 rounded-full bg-primary-foreground shadow-[0_0_16px_5px_hsl(var(--primary-foreground)/0.5)]" />
          </span>
          <p className="mt-6 text-6xl font-semibold tracking-tight text-primary">404</p>
          <h1 className="mt-3 text-xl font-semibold">This page has gone dark</h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s get you
            back to the conversation.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link
              href="/rooms"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to chat
            </Link>
            <Link
              href="/login"
              className="inline-flex h-10 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
