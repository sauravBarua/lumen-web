import { Smile } from 'lucide-react';
import type { ReactionSummaryDto } from '@/lib/socket-events';
import { cn } from '@/lib/utils';

export function ReactionBar({
  reactions,
  onToggle,
  addButton,
  align = 'start',
}: {
  reactions: ReactionSummaryDto[];
  onToggle: (emoji: string) => void;
  addButton: React.ReactNode;
  align?: 'start' | 'end';
}) {
  return (
    <div
      className={cn('mt-1 flex flex-wrap items-center gap-1.5', align === 'end' && 'justify-end')}
      role="group"
      aria-label="Reactions"
    >
      {reactions.map((r) => (
        <button
          key={r.emoji}
          type="button"
          aria-pressed={r.reactedByMe}
          aria-label={`${r.emoji} ${r.count} ${r.count === 1 ? 'reaction' : 'reactions'}${r.reactedByMe ? ', including yours' : ''}`}
          data-emoji={r.emoji}
          data-count={r.count}
          onClick={() => onToggle(r.emoji)}
          className={cn(
            'inline-flex h-6 items-center gap-1 rounded-full border px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            r.reactedByMe
              ? 'border-primary/60 bg-accent text-accent-foreground hover:bg-accent/80'
              : 'border-border bg-background hover:bg-accent',
          )}
        >
          <span aria-hidden="true">{r.emoji}</span>
          <span className="font-medium">{r.count}</span>
        </button>
      ))}
      {addButton}
    </div>
  );
}

export function AddReactionButton({
  onClick,
  expanded,
  variant,
}: {
  onClick: () => void;
  expanded: boolean;
  variant: 'chip' | 'toolbar';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="menu"
      aria-expanded={expanded}
      aria-label="Add reaction"
      className={cn(
        'inline-flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        variant === 'chip'
          ? 'size-6 rounded-full border border-dashed border-input'
          : 'size-8 rounded',
      )}
    >
      <Smile className={variant === 'chip' ? 'size-3.5' : 'size-4'} aria-hidden="true" />
    </button>
  );
}
