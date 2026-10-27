import { CircleAlert } from 'lucide-react';
import type * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type TextFieldProps = React.ComponentProps<typeof Input> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  invalid?: boolean;
};

/** Label + input + hint + field error. The hint is replaced by the error when there is one. */
export function TextField({ id, label, hint, error, invalid, ...props }: TextFieldProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        aria-invalid={invalid || !!error || undefined}
        aria-describedby={describedBy}
        {...props}
      />
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="flex items-center gap-1.5 text-sm text-destructive"
        >
          <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
