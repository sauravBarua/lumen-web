import { typingText } from '@/lib/format';

/** Always reserves its height so the composer does not jump when someone starts typing. */
export function TypingIndicator({ names }: { names: string[] }) {
  const text = typingText(names);
  return (
    <div className="flex h-5 items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
      {text && (
        <>
          <span className="flex items-center gap-0.5" aria-hidden="true">
            <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
            <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
            <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
          </span>
          <span>{text}</span>
        </>
      )}
    </div>
  );
}
