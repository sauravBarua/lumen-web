import { serverApi } from '@/lib/api/server';
import type { ApiFailure, ApiResult, ApiSession, ApiUser } from './types';

interface AuthBody {
  accessToken: string;
  expiresIn: number;
  user: ApiUser;
}

const NETWORK_FAILURE: ApiFailure = { ok: false, status: 0 };

/** The API sends the rotating refresh token only as an httpOnly cookie. */
function refreshCookie(response: Response): string | undefined {
  for (const cookie of response.headers.getSetCookie()) {
    const match = /^refresh_token=([^;]+)/.exec(cookie);
    if (match) return match[1];
  }
  return undefined;
}

async function authenticate(
  call: () => Promise<{ data?: unknown; error?: unknown; response: Response }>,
): Promise<ApiResult<ApiSession>> {
  try {
    const { data, error, response } = await call();
    if (!data) return { ok: false, status: response.status, body: error };
    const refreshToken = refreshCookie(response);
    if (!refreshToken) return { ok: false, status: 502 };
    const body = data as AuthBody;
    return {
      ok: true,
      value: {
        user: body.user,
        accessToken: body.accessToken,
        accessTokenExpires: Date.now() + body.expiresIn * 1000,
        refreshToken,
      },
    };
  } catch {
    return NETWORK_FAILURE;
  }
}

export function apiLogin(input: { email: string; password: string }) {
  return authenticate(() => serverApi.POST('/api/v1/auth/login', { body: input }));
}

export function apiRegister(input: { email: string; username: string; password: string }) {
  return authenticate(() => serverApi.POST('/api/v1/auth/register', { body: input }));
}

export function apiRefresh(refreshToken: string) {
  return authenticate(() =>
    serverApi.POST('/api/v1/auth/refresh', {
      headers: { Cookie: `refresh_token=${refreshToken}` },
    }),
  );
}

/** Best effort: revokes the whole session family on the API when the user signs out. */
export async function apiLogout(refreshToken: string): Promise<void> {
  try {
    await serverApi.POST('/api/v1/auth/logout', {
      headers: { Cookie: `refresh_token=${refreshToken}` },
    });
  } catch {
    // The Auth.js session is cleared regardless.
  }
}
