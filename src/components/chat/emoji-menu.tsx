'use client';

import { useEffect, useRef } from 'react';
import { menuKeyDown } from '@/lib/menu';
import { cn } from '@/lib/utils';

export const QUICK_EMOJIS = [
  { emoji: '👍', label: 'Thumbs up' },
  { emoji: '❤️', label: 'Heart' },
  { emoji: '🎉', label: 'Party popper' },
  { emoji: '😄', label: 'Laughing' },
  { emoji: '👀', label: 'Eyes' },
];

export function EmojiMenu({
  label,
  onPick,
  className,
}: {
  label: string;
  onPick: (emoji: string) => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('[role=menuitem]')?.focus();
  }, []);

  return (
    <div
      ref={ref}
      role="menu"
      aria-label={label}
      onKeyDown={menuKeyDown}
      className={cn(
        'absolute z-50 flex gap-0.5 rounded-lg border border-border bg-popover p-1 shadow-md',
        className,
      )}
    >
      {QUICK_EMOJIS.map(({ emoji, label: name }) => (
        <button
          key={emoji}
          role="menuitem"
          type="button"
          aria-label={name}
          onClick={() => onPick(emoji)}
          className="grid size-9 place-items-center rounded-md text-lg hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
