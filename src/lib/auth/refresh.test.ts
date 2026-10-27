// @vitest-environment node
import type { JWT } from 'next-auth/jwt';
import { describe, expect, it, vi } from 'vitest';
import { refreshJwt, refreshOnce } from './refresh';
import type { ApiResult, ApiSession } from './types';

const fresh: ApiSession = {
  user: { id: 'u1', email: 'a@b.co', username: 'ada', role: 'USER' },
  accessToken: 'new-access',
  accessTokenExpires: Date.now() + 900_000,
  refreshToken: 'new-refresh',
};
const success: ApiResult<ApiSession> = { ok: true, value: fresh };

const jwt = (refreshToken: string): JWT => ({
  id: 'u1',
  username: 'ada',
  role: 'USER',
  accessToken: 'old-access',
  accessTokenExpires: 0,
  refreshToken,
});

describe('refreshOnce', () => {
  it('shares one API call between concurrent requests', async () => {
    const call = vi.fn().mockResolvedValue(success);
    const [a, b, c] = await Promise.all([
      refreshOnce('rt-concurrent', call),
      refreshOnce('rt-concurrent', call),
      refreshOnce('rt-concurrent', call),
    ]);
    expect(call).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  it('answers a late request that still carries the old token from the grace cache', async () => {
    const call = vi.fn().mockResolvedValue(success);
    await refreshOnce('rt-late', call);
    await refreshOnce('rt-late', call);
    expect(call).toHaveBeenCalledTimes(1);
  });

  it('does not cache transient failures', async () => {
    const call = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 0 })
      .mockResolvedValueOnce(success);
    expect((await refreshOnce('rt-transient', call)).ok).toBe(false);
    expect((await refreshOnce('rt-transient', call)).ok).toBe(true);
    expect(call).toHaveBeenCalledTimes(2);
  });

  it('keeps definitive rejections so a rejected token is not retried in a loop', async () => {
    const call = vi.fn().mockResolvedValue({ ok: false, status: 401 });
    await refreshOnce('rt-rejected', call);
    await refreshOnce('rt-rejected', call);
    expect(call).toHaveBeenCalledTimes(1);
  });
});

describe('refreshJwt', () => {
  it('stores the rotated tokens', async () => {
    const out = await refreshJwt(jwt('rt-a'), vi.fn().mockResolvedValue(success));
    expect(out).toMatchObject({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
      id: 'u1',
      error: undefined,
    });
  });

  it('flags the session when the API rejects the refresh token', async () => {
    const out = await refreshJwt(
      jwt('rt-b'),
      vi.fn().mockResolvedValue({ ok: false, status: 401 }),
    );
    expect(out.error).toBe('RefreshTokenError');
    expect(out.refreshToken).toBe('rt-b');
  });

  it('keeps the session untouched when the API is unreachable', async () => {
    const token = jwt('rt-c');
    const out = await refreshJwt(token, vi.fn().mockResolvedValue({ ok: false, status: 0 }));
    expect(out).toEqual(token);
  });
});
