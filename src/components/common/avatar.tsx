import { avatarColor, initials } from '@/lib/format';
import type { PresenceStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const DOT: Record<PresenceStatus, string> = {
  online: 'bg-success shadow-[0_0_6px_1px_hsl(var(--success)/0.6)]',
  away: 'bg-warning',
  offline: 'bg-muted-foreground/50',
};

export function PresenceDot({ status, className }: { status: PresenceStatus; className?: string }) {
  return (
    <span className={cn('rounded-full', DOT[status], className)}>
      <span className="sr-only">{status}</span>
    </span>
  );
}

const SIZE = { sm: 'size-6 text-[10px]', md: 'size-8 text-xs', lg: 'size-9 text-xs' } as const;

export function Avatar({
  name,
  size = 'md',
  own = false,
  presence,
  ring = 'ring-card',
  muted = false,
}: {
  name: string;
  size?: keyof typeof SIZE;
  own?: boolean;
  presence?: PresenceStatus;
  /** Ring colour of the presence dot, matching the surface the avatar sits on. */
  ring?: 'ring-card' | 'ring-popover' | 'ring-background';
  muted?: boolean;
}) {
  return (
    <span className="relative shrink-0">
      <span
        aria-hidden="true"
        className={cn(
          'grid place-items-center rounded-full font-semibold',
          SIZE[size],
          own ? 'bg-accent text-accent-foreground' : avatarColor(name),
          muted && 'opacity-80',
        )}
      >
        {initials(name)}
      </span>
      {presence && (
        <PresenceDot
          status={presence}
          className={cn('absolute -bottom-0.5 -right-0.5 size-2.5 ring-2', ring)}
        />
      )}
    </span>
  );
}
