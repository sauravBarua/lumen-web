import type { Metadata } from 'next';
import { auth } from '@/auth';
import { Logo } from '@/components/logo';
import { SignOutButton } from '@/components/sign-out-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { WhoAmI } from '@/components/who-am-i';

export const metadata: Metadata = { title: 'Rooms' };

// Placeholder: the real room list and chat view arrive in Phase 10.
export default async function RoomsPage() {
  const session = await auth();
  return (
    <div className="min-h-dvh">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome, {session?.user.username}</h1>
        <div className="rounded-lg border border-border bg-card p-5">
          <WhoAmI />
        </div>
        <p className="text-sm text-muted-foreground">Rooms and chat come next.</p>
      </main>
    </div>
  );
}
