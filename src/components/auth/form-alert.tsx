import { CircleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FormAlert({
  tone = 'destructive',
  className,
  children,
}: {
  tone?: 'destructive' | 'info';
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-2.5 rounded-md border px-3 py-2.5 text-sm',
        tone === 'destructive'
          ? 'border-destructive/40 bg-destructive/10 text-destructive'
          : 'border-primary/30 bg-accent text-accent-foreground',
        className,
      )}
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}
