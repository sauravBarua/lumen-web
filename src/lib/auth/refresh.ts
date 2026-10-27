import { createHash } from 'node:crypto';
import type { JWT } from 'next-auth/jwt';
import { apiRefresh } from './api-auth';
import type { ApiResult, ApiSession } from './types';

/** Refresh this long before the access token expires. */
export const REFRESH_MARGIN_MS = 60_000;
/** The API treats a reused refresh token as theft, so a finished refresh is remembered a while. */
const GRACE_MS = 60_000;

type RefreshCall = (refreshToken: string) => Promise<ApiResult<ApiSession>>;

const store = globalThis as unknown as {
  __lumenRefreshes?: Map<string, Promise<ApiResult<ApiSession>>>;
};
const refreshes = (store.__lumenRefreshes ??= new Map());

/**
 * One API refresh per refresh token. The proxy, server rendering and parallel requests can all see the
 * same expired token at once: they must share one call (and its result), or the API would revoke the session.
 */
export function refreshOnce(
  refreshToken: string,
  call: RefreshCall = apiRefresh,
): Promise<ApiResult<ApiSession>> {
  const key = createHash('sha256').update(refreshToken).digest('hex');
  const existing = refreshes.get(key);
  if (existing) return existing;

  const promise = call(refreshToken);
  refreshes.set(key, promise);
  void promise.then(
    (result) => {
      const transient =
        !result.ok && (result.status === 0 || result.status === 429 || result.status >= 500);
      if (transient) {
        refreshes.delete(key); // worth retrying right away
      } else {
        const timer = setTimeout(() => refreshes.delete(key), GRACE_MS);
        (timer as { unref?: () => void }).unref?.();
      }
    },
    () => refreshes.delete(key),
  );
  return promise;
}

/** The Auth.js jwt callback: new tokens on success, an error flag when the API rejects the refresh token. */
export async function refreshJwt(token: JWT, call: RefreshCall = apiRefresh): Promise<JWT> {
  const result = await refreshOnce(token.refreshToken, call);
  if (result.ok) {
    const s = result.value;
    return {
      ...token,
      accessToken: s.accessToken,
      accessTokenExpires: s.accessTokenExpires,
      refreshToken: s.refreshToken,
      error: undefined,
    };
  }
  if (result.status === 401) return { ...token, error: 'RefreshTokenError' };
  return token; // API unreachable or busy: keep the session and retry on the next request
}
