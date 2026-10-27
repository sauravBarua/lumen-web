import { randomBytes } from 'node:crypto';
import type { ApiSession } from './types';

const TTL_MS = 30_000;

// On globalThis so Next's separate server bundles (actions, route handlers) share one store.
const store = globalThis as unknown as {
  __lumenHandoffs?: Map<string, { session: ApiSession; expires: number }>;
};
const handoffs = (store.__lumenHandoffs ??= new Map());

/**
 * A Server Action logs in against the API itself (to control the errors it shows), then hands the
 * result to Auth.js through this one-time, short-lived, unguessable id.
 */
export function putHandoff(session: ApiSession): string {
  const now = Date.now();
  for (const [id, entry] of handoffs) if (entry.expires <= now) handoffs.delete(id);
  const id = randomBytes(32).toString('base64url');
  handoffs.set(id, { session, expires: now + TTL_MS });
  return id;
}

export function takeHandoff(id: string): ApiSession | null {
  const entry = handoffs.get(id);
  handoffs.delete(id);
  return entry && entry.expires > Date.now() ? entry.session : null;
}
