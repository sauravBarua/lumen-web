import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';

/** Two-column auth layout: brand panel (desktop only) + the form column. */
export function AuthShell({
  panel,
  children,
}: {
  panel: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section
        className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between"
        aria-hidden="true"
      >
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-primary-foreground/10 blur-3xl" />
        <Logo onPrimary className="relative" />
        <div className="relative max-w-md space-y-6">{panel}</div>
        <p className="relative text-sm text-primary-foreground/70">© 2026 Lumen</p>
      </section>

      <section className="relative flex items-center justify-center px-4 py-12">
        <ThemeToggle className="absolute right-4 top-4" />
        <div className="w-full max-w-sm space-y-6">
          <Logo className="lg:hidden" />
          {children}
        </div>
      </section>
    </main>
  );
}

export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 text-card-foreground sm:p-8">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}
