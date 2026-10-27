import type { LucideIcon } from 'lucide-react';
import { CircleAlert, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-10 text-center', className)}>
      <span className="grid size-12 place-items-center rounded-full bg-accent text-accent-foreground">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-sm font-semibold">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      {children && <div className="mt-5 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  onRetry,
  icon: Icon = CircleAlert,
  tone = 'error',
  className,
  children,
}: {
  title: string;
  description?: string;
  onRetry?: () => void;
  icon?: LucideIcon;
  tone?: 'error' | 'muted';
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center px-6 py-10 text-center', className)}
    >
      <span
        className={cn(
          'grid size-12 place-items-center rounded-full',
          tone === 'error'
            ? 'bg-destructive/10 text-destructive'
            : 'bg-muted text-muted-foreground',
        )}
      >
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-sm font-semibold">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      {(onRetry || children) && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {onRetry && (
            <Button size="sm" onClick={onRetry}>
              <RefreshCw className="size-4" aria-hidden="true" />
              Retry
            </Button>
          )}
          {children}
        </div>
      )}
    </div>
  );
}
