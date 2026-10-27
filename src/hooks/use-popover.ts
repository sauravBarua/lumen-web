import { useCallback, useEffect, useState } from 'react';

/**
 * Open/close state with outside-click and Escape dismissal.
 * Pass `attach` as the `ref` of the wrapper around trigger + popover. It is a callback ref, and it is
 * deliberately not named "ref": the React Compiler lint treats anything with that name as a ref object.
 */
export function usePopover() {
  const [open, setOpen] = useState(false);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const attach = useCallback((element: HTMLDivElement | null) => setContainer(element), []);
  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (container && !container.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, container]);

  return { open, close, toggle, attach };
}
