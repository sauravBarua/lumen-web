import type { ZodError } from 'zod';
import type { ApiFailure, AuthActionResult, FieldName } from './types';

const GENERIC = 'Something went wrong. Please try again.';
const FIELDS: FieldName[] = ['email', 'username', 'password'];
const isField = (value: unknown): value is FieldName => FIELDS.includes(value as FieldName);

interface ApiErrorBody {
  message?: unknown;
  details?: { path?: unknown; message?: unknown }[];
}

const readBody = (body: unknown): ApiErrorBody =>
  body && typeof body === 'object' ? (body as ApiErrorBody) : {};

type FieldErrors = Partial<Record<FieldName, string>>;

function fieldErrorsFromApi(body: unknown): FieldErrors | undefined {
  const out: FieldErrors = {};
  for (const d of readBody(body).details ?? []) {
    if (isField(d.path) && typeof d.message === 'string' && !out[d.path]) out[d.path] = d.message;
  }
  return Object.keys(out).length ? out : undefined;
}

function mapCommon(failure: ApiFailure): AuthActionResult {
  if (failure.status === 429) {
    return { ok: false, code: 'RATE_LIMITED', message: 'Too many attempts, try again in a minute' };
  }
  if (failure.status === 0 || failure.status >= 502) {
    return {
      ok: false,
      code: 'UNAVAILABLE',
      message: 'Lumen is unreachable. Try again in a moment.',
    };
  }
  return { ok: false, code: 'UNKNOWN', message: GENERIC };
}

export function mapLoginFailure(failure: ApiFailure): AuthActionResult {
  if (failure.status === 401) {
    return { ok: false, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' };
  }
  return mapCommon(failure);
}

export function mapRegisterFailure(failure: ApiFailure): AuthActionResult {
  if (failure.status === 409) {
    const message = String(readBody(failure.body).message ?? '');
    // "Email or username already taken" (and any unknown 409 text) marks both fields.
    const both = /email or username/i.test(message) || !/^(email|username)/i.test(message);
    const fieldErrors: FieldErrors = {};
    if (both || /^email/i.test(message)) fieldErrors.email = 'This email is already registered.';
    if (both || /^username/i.test(message))
      fieldErrors.username = 'This username is already taken.';
    return { ok: false, code: 'CONFLICT', message: 'Check the highlighted fields.', fieldErrors };
  }
  if (failure.status === 400) {
    return {
      ok: false,
      code: 'VALIDATION',
      message: 'Check the highlighted fields.',
      fieldErrors: fieldErrorsFromApi(failure.body),
    };
  }
  return mapCommon(failure);
}

/** For input that fails the Zod schemas on the server (the client normally catches it first). */
export function validationFailure(error: ZodError): AuthActionResult {
  const fieldErrors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (isField(key) && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { ok: false, code: 'VALIDATION', message: 'Check the highlighted fields.', fieldErrors };
}

export const UNKNOWN_FAILURE: AuthActionResult = { ok: false, code: 'UNKNOWN', message: GENERIC };
