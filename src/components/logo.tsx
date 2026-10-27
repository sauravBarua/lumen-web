import { cn } from '@/lib/utils';

/** The glowing-dot mark. `onPrimary` is for use on the primary-colored brand panel. */
export function Logo({
  onPrimary = false,
  className,
}: {
  onPrimary?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'grid size-9 place-items-center rounded-lg',
          onPrimary ? 'bg-primary-foreground/15' : 'bg-primary',
        )}
      >
        <span className="size-3 rounded-full bg-primary-foreground shadow-[0_0_14px_4px_hsl(var(--primary-foreground)/0.55)]" />
      </span>
      <span className="text-xl font-semibold tracking-tight">Lumen</span>
    </div>
  );
}
