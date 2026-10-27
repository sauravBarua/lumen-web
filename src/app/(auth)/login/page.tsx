import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthCard, AuthShell } from '@/components/auth/auth-shell';
import { LoginBrandPanel } from '@/components/auth/brand-panels';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; reason?: string }>;
}) {
  const { callbackUrl, reason } = await searchParams;
  return (
    <AuthShell panel={<LoginBrandPanel />}>
      <AuthCard title="Welcome back" description="Sign in to continue to your rooms.">
        <LoginForm
          callbackUrl={callbackUrl}
          notice={reason === 'session_expired' ? 'Session expired. Sign in again.' : undefined}
        />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to Lumen?{' '}
          <Link
            href="/register"
            className="rounded-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Create an account
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}
