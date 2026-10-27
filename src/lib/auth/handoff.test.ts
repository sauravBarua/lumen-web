// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { putHandoff, takeHandoff } from './handoff';
import type { ApiSession } from './types';

const session: ApiSession = {
  user: { id: 'u1', email: 'a@b.co', username: 'ada', role: 'USER' },
  accessToken: 'access',
  accessTokenExpires: Date.now() + 900_000,
  refreshToken: 'refresh',
};

afterEach(() => vi.useRealTimers());

describe('handoff', () => {
  it('returns the session once and forgets it', () => {
    const id = putHandoff(session);
    expect(takeHandoff(id)).toEqual(session);
    expect(takeHandoff(id)).toBeNull();
  });

  it('rejects unknown ids', () => {
    expect(takeHandoff('nope')).toBeNull();
    expect(takeHandoff('')).toBeNull();
  });

  it('expires after 30 seconds', () => {
    vi.useFakeTimers();
    const id = putHandoff(session);
    vi.advanceTimersByTime(30_001);
    expect(takeHandoff(id)).toBeNull();
  });

  it('issues unguessable, distinct ids', () => {
    const a = putHandoff(session);
    const b = putHandoff(session);
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(40);
  });
});
