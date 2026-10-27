import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthCard, AuthShell } from '@/components/auth/auth-shell';
import { RegisterBrandPanel } from '@/components/auth/brand-panels';
import { RegisterForm } from '@/components/auth/register-form';

export const metadata: Metadata = { title: 'Create account' };

export default function RegisterPage() {
  return (
    <AuthShell panel={<RegisterBrandPanel />}>
      <AuthCard title="Create your account" description="It takes less than a minute.">
        <RegisterForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/login"
            className="rounded-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Sign in
          </Link>
        </p>
      </AuthCard>
    </AuthShell>
  );
}
