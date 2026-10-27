import { useSyncExternalStore } from 'react';

const subscribe = () => () => undefined;

/** false while the page is server-rendered and during hydration, true once React is in control. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
