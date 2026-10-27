import { getSession } from 'next-auth/react';
import createClient from 'openapi-fetch';
import { env } from '@/env';
import type { paths } from './schema';

let cached: { token: string; expiresAt: number } | null = null;
let pending: Promise<string | null> | null = null;
let locked = false;

async function loadSession(): Promise<string | null> {
  const session = await getSession();
  if (!session) {
    cached = null;
    return null;
  }
  if (session.error) {
    cached = null;
    // The API rejected the refresh token: this session is over.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = '/login?reason=session_expired';
    return null;
  }
  cached = { token: session.accessToken, expiresAt: session.accessTokenExpires };
  return cached.token;
}

/** Current access token. The session endpoint also refreshes it, so it is only asked near expiry. */
export async function getAccessToken(): Promise<string | null> {
  if (locked) return null;
  if (cached && Date.now() < cached.expiresAt - 30_000) return cached.token;
  // One session request at a time: parallel ones (for example at page load) would each re-issue the cookie.
  pending ??= loadSession().finally(() => {
    pending = null;
  });
  return pending;
}

/**
 * Call right before signing out: no new session request can start, and the one in flight finishes first,
 * so nothing can re-create the session cookie after it has been cleared.
 */
export async function lockSession(): Promise<void> {
  locked = true;
  cached = null;
  try {
    await pending;
  } catch {
    // A failed session request leaves nothing to wait for.
  }
}

/** Called by the auth pages: after a sign-out the next sign-in starts clean. */
export function unlockSession(): void {
  locked = false;
}

/** Typed API client for client components. Adds the bearer token to every request. */
export const apiClient = createClient<paths>({ baseUrl: env.NEXT_PUBLIC_API_URL });

apiClient.use({
  async onRequest({ request }) {
    const token = await getAccessToken();
    if (token) request.headers.set('Authorization', `Bearer ${token}`);
    return request;
  },
  onResponse({ response }) {
    if (response.status === 401) cached = null; // next request fetches a fresh session
  },
});
