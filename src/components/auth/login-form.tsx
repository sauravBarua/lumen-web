'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { FormAlert } from '@/components/auth/form-alert';
import { TextField } from '@/components/auth/text-field';
import { Button } from '@/components/ui/button';
import { useHydrated } from '@/hooks/use-hydrated';
import { loginAction } from '@/lib/auth/actions';
import { safeRedirect } from '@/lib/safe-redirect';
import { type LoginValues, loginSchema } from '@/lib/schemas/auth';

export function LoginForm({ callbackUrl, notice }: { callbackUrl?: string; notice?: string }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const [pending, startTransition] = useTransition();
  const [redirecting, setRedirecting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const loading = pending || redirecting;

  const onSubmit = handleSubmit((values) => {
    setFailure(null);
    startTransition(async () => {
      const result = await loginAction(values);
      if (result.ok) {
        setRedirecting(true);
        router.replace(safeRedirect(callbackUrl));
        router.refresh();
        return;
      }
      setFailure(result.message);
    });
  });

  const message = failure ?? notice;

  return (
    <>
      {message && (
        <FormAlert tone={failure ? 'destructive' : 'info'} className="mt-5">
          {message}
        </FormAlert>
      )}
      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
        <TextField
          id="email"
          type="email"
          label="Email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          invalid={!!failure}
          disabled={loading}
          {...register('email')}
        />
        <TextField
          id="password"
          type="password"
          label="Password"
          autoComplete="current-password"
          placeholder="Your password"
          error={errors.password?.message}
          invalid={!!failure}
          disabled={loading}
          {...register('password')}
        />
        <Button type="submit" className="w-full" loading={loading} disabled={!hydrated}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </>
  );
}
