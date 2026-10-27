import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema } from './auth';

const messages = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map((i) => i.message) ?? [];

describe('loginSchema', () => {
  it('trims the email and accepts valid input', () => {
    expect(loginSchema.parse({ email: ' a@b.co ', password: 'x' })).toEqual({
      email: 'a@b.co',
      password: 'x',
    });
  });

  it('reports missing and invalid fields', () => {
    expect(messages(loginSchema.safeParse({ email: '', password: '' }))).toEqual([
      'Email is required',
      'Password is required',
    ]);
    expect(messages(loginSchema.safeParse({ email: 'nope', password: 'x' }))).toContain(
      'Enter a valid email address',
    );
  });
});

describe('registerSchema', () => {
  const valid = { email: 'ada@example.com', username: 'ada_1', password: 'longenough' };

  it('accepts valid input', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects usernames the API would reject', () => {
    for (const username of ['ab', 'Ada', 'has space', 'a'.repeat(21)]) {
      expect(registerSchema.safeParse({ ...valid, username }).success).toBe(false);
    }
  });

  it('enforces the password length bounds', () => {
    expect(registerSchema.safeParse({ ...valid, password: 'short' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, password: 'x'.repeat(73) }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, password: 'x'.repeat(72) }).success).toBe(true);
  });
});
