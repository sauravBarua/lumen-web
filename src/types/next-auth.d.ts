import type { DefaultSession } from 'next-auth';

type Role = 'USER' | 'ADMIN';

declare module 'next-auth' {
  interface User {
    username: string;
    role: Role;
    accessToken: string;
    accessTokenExpires: number;
    refreshToken: string;
  }

  interface Session {
    /** Bearer token for the API (short-lived, refreshed by the proxy and /api/auth/session). */
    accessToken: string;
    accessTokenExpires: number;
    /** Set when the refresh token was rejected: the user must sign in again. */
    error?: 'RefreshTokenError';
    user: { id: string; username: string; role: Role } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: string;
    role: Role;
    accessToken: string;
    accessTokenExpires: number;
    /** Never copied into the Session: it stays in the encrypted httpOnly cookie. */
    refreshToken: string;
    error?: 'RefreshTokenError';
  }
}
