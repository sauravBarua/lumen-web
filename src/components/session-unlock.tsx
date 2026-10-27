'use client';

import { useEffect } from 'react';
import { unlockSession } from '@/lib/api/browser';

/** Rendered on the auth pages: landing there after a sign-out re-enables session requests for the next sign-in. */
export function SessionUnlock() {
  useEffect(() => {
    unlockSession();
  }, []);
  return null;
}
