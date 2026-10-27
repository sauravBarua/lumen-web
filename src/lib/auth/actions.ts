'use server';

import { signIn, signOut } from '@/auth';
import { apiLogin, apiRegister } from '@/lib/auth/api-auth';
import { putHandoff } from '@/lib/auth/handoff';
import {
  mapLoginFailure,
  mapRegisterFailure,
  UNKNOWN_FAILURE,
  validationFailure,
} from '@/lib/auth/map-error';
import type { ApiResult, ApiSession, AuthActionResult } from '@/lib/auth/types';
import { loginSchema, registerSchema } from '@/lib/schemas/auth';

/** Hands the API's tokens to Auth.js (credentials provider) so it can set its session cookie. */
async function startSession(
  result: ApiResult<ApiSession>,
  onFailure: (r: never) => AuthActionResult,
) {
  if (!result.ok) return onFailure(result as never);
  try {
    await signIn('credentials', { handoff: putHandoff(result.value), redirect: false });
    return { ok: true } satisfies AuthActionResult;
  } catch {
    return UNKNOWN_FAILURE;
  }
}

export async function loginAction(input: unknown): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return startSession(
    await apiLogin(parsed.data),
    mapLoginFailure as (r: never) => AuthActionResult,
  );
}

export async function registerAction(input: unknown): Promise<AuthActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return startSession(
    await apiRegister(parsed.data),
    mapRegisterFailure as (r: never) => AuthActionResult,
  );
}

export async function signOutAction() {
  await signOut({ redirectTo: '/login' });
}
