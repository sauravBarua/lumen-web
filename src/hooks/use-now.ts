import { useSyncExternalStore } from 'react';

function subscribe(onChange: () => void) {
  const timer = setInterval(onChange, 30_000);
  return () => clearInterval(timer);
}

// Rounded to the minute so the snapshot is stable between ticks.
const snapshot = () => Math.floor(Date.now() / 60_000) * 60_000;

/** Current time (ms), refreshed every 30 s: for "2 min ago" labels. */
export function useNow(): number {
  return useSyncExternalStore(subscribe, snapshot, () => 0);
}
