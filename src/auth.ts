import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { apiLogout } from '@/lib/auth/api-auth';
import { takeHandoff } from '@/lib/auth/handoff';
import { REFRESH_MARGIN_MS, refreshJwt } from '@/lib/auth/refresh';

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Same lifetime as the API's refresh token (30 days).
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: '/login' },
  providers: [
    // The login and register Server Actions authenticate against the API first and then pass a
    // one-time handoff id here: this provider never sees a password.
    Credentials({
      credentials: { handoff: { type: 'text' } },
      authorize(credentials) {
        const session = takeHandoff(String(credentials?.handoff ?? ''));
        if (!session) return null;
        return {
          id: session.user.id,
          email: session.user.email,
          name: session.user.username,
          username: session.user.username,
          role: session.user.role,
          accessToken: session.accessToken,
          accessTokenExpires: session.accessTokenExpires,
          refreshToken: session.refreshToken,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id as string,
          username: user.username,
          role: user.role,
          accessToken: user.accessToken,
          accessTokenExpires: user.accessTokenExpires,
          refreshToken: user.refreshToken,
          error: undefined,
        };
      }
      if (token.error || Date.now() < token.accessTokenExpires - REFRESH_MARGIN_MS) return token;
      return refreshJwt(token);
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.username = token.username;
      session.user.role = token.role;
      session.accessToken = token.accessToken;
      session.accessTokenExpires = token.accessTokenExpires;
      session.error = token.error;
      return session;
    },
  },
  events: {
    async signOut(message) {
      if ('token' in message && message.token?.refreshToken) {
        await apiLogout(message.token.refreshToken);
      }
    },
  },
});
