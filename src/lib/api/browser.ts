import { getSession } from 'next-auth/react';
import createClient from 'openapi-fetch';
import { env } from '@/env';
import type { paths } from './schema';

let cached: { token: string; expiresAt: number } | null = null;

/** The session endpoint also refreshes the token when needed, so it is asked only near expiry. */
async function accessToken(): Promise<string | null> {
  if (cached && Date.now() < cached.expiresAt - 30_000) return cached.token;
  const session = await getSession();
  if (!session || session.error) {
    cached = null;
    return null;
  }
  cached = { token: session.accessToken, expiresAt: session.accessTokenExpires };
  return cached.token;
}

/** Typed API client for client components. Adds the bearer token to every request. */
export const apiClient = createClient<paths>({ baseUrl: env.NEXT_PUBLIC_API_URL });

apiClient.use({
  async onRequest({ request }) {
    const token = await accessToken();
    if (token) request.headers.set('Authorization', `Bearer ${token}`);
    return request;
  },
  onResponse({ response }) {
    if (response.status === 401) cached = null; // next request fetches a fresh session
  },
});
