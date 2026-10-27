import { cn } from '@/lib/utils';

export function Switch({
  checked,
  onCheckedChange,
  className,
  ...props
}: Omit<React.ComponentProps<'button'>, 'onClick'> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'group relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-input transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover aria-checked:bg-primary',
        className,
      )}
      {...props}
    >
      <span className="pointer-events-none block size-5 translate-x-0.5 rounded-full bg-background shadow transition-transform group-aria-checked:translate-x-[22px]" />
    </button>
  );
}
