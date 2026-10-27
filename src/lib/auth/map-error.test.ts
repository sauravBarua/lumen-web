// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { registerSchema } from '@/lib/schemas/auth';
import { mapLoginFailure, mapRegisterFailure, validationFailure } from './map-error';

describe('mapLoginFailure', () => {
  it('maps bad credentials, rate limits and outages', () => {
    expect(mapLoginFailure({ ok: false, status: 401 })).toMatchObject({
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password.',
    });
    expect(mapLoginFailure({ ok: false, status: 429 })).toMatchObject({
      code: 'RATE_LIMITED',
      message: 'Too many attempts, try again in a minute',
    });
    expect(mapLoginFailure({ ok: false, status: 0 })).toMatchObject({ code: 'UNAVAILABLE' });
    expect(mapLoginFailure({ ok: false, status: 503 })).toMatchObject({ code: 'UNAVAILABLE' });
    expect(mapLoginFailure({ ok: false, status: 418 })).toMatchObject({ code: 'UNKNOWN' });
  });
});

describe('mapRegisterFailure', () => {
  it('points a conflict at the right field', () => {
    const conflict = (message: string) =>
      mapRegisterFailure({ ok: false, status: 409, body: { message } });
    expect(conflict('Email already registered')).toMatchObject({
      code: 'CONFLICT',
      fieldErrors: { email: 'This email is already registered.' },
    });
    expect(conflict('Username already taken')).toMatchObject({
      fieldErrors: { username: 'This username is already taken.' },
    });
    expect(conflict('Email or username already taken')).toMatchObject({
      fieldErrors: { email: expect.any(String), username: expect.any(String) },
    });
  });

  it('maps API validation details to fields', () => {
    const result = mapRegisterFailure({
      ok: false,
      status: 400,
      body: {
        message: 'Validation failed',
        details: [
          { path: 'username', message: 'Username must be 3-20 characters' },
          { path: 'username', message: 'ignored duplicate' },
          { path: 'other', message: 'unknown field' },
        ],
      },
    });
    expect(result).toMatchObject({
      code: 'VALIDATION',
      fieldErrors: { username: 'Username must be 3-20 characters' },
    });
  });

  it('falls back to the common failures', () => {
    expect(mapRegisterFailure({ ok: false, status: 429 })).toMatchObject({ code: 'RATE_LIMITED' });
  });
});

describe('validationFailure', () => {
  it('keeps the first message per field', () => {
    const parsed = registerSchema.safeParse({ email: '', username: 'X', password: 'short' });
    if (parsed.success) throw new Error('expected a failure');
    const result = validationFailure(parsed.error);
    expect(result).toMatchObject({
      ok: false,
      fieldErrors: {
        email: 'Email is required',
        username: expect.any(String),
        password: 'Password must be at least 8 characters',
      },
    });
  });
});
