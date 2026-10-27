import { splitMentions } from '@/lib/text';
import { cn } from '@/lib/utils';

/** Plain text with @mentions highlighted (stronger when it is me). Never renders HTML. */
export function MessageText({
  content,
  meUsername,
  variant = 'incoming',
}: {
  content: string;
  meUsername: string;
  /** "outgoing" is for my own messages, which sit on the primary-coloured bubble. */
  variant?: 'incoming' | 'outgoing';
}) {
  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
      {splitMentions(content).map((part, i) =>
        part.type === 'text' ? (
          <span key={i}>{part.value}</span>
        ) : (
          <span
            key={i}
            data-mention={part.username}
            className={cn(
              'rounded px-1 font-medium',
              variant === 'outgoing'
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : 'bg-accent text-accent-foreground',
              variant === 'incoming' &&
                part.username === meUsername.toLowerCase() &&
                'ring-1 ring-primary/50',
            )}
          >
            {part.value}
          </span>
        ),
      )}
    </p>
  );
}
