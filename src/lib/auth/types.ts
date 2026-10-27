export type FieldName = 'email' | 'username' | 'password';

export type AuthActionResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | 'INVALID_CREDENTIALS'
        | 'RATE_LIMITED'
        | 'VALIDATION'
        | 'CONFLICT'
        | 'UNAVAILABLE'
        | 'UNKNOWN';
      message: string;
      fieldErrors?: Partial<Record<FieldName, string>>;
    };

export interface ApiUser {
  id: string;
  email: string;
  username: string;
  role: 'USER' | 'ADMIN';
}

/** What a successful login, registration or refresh gives us. */
export interface ApiSession {
  user: ApiUser;
  accessToken: string;
  /** ms since epoch */
  accessTokenExpires: number;
  refreshToken: string;
}

/** status 0 = the API could not be reached. */
export interface ApiFailure {
  ok: false;
  status: number;
  body?: unknown;
}

export type ApiResult<T> = { ok: true; value: T } | ApiFailure;
