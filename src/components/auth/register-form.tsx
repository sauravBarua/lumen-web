'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { FormAlert } from '@/components/auth/form-alert';
import { TextField } from '@/components/auth/text-field';
import { Button } from '@/components/ui/button';
import { registerAction } from '@/lib/auth/actions';
import type { FieldName } from '@/lib/auth/types';
import { type RegisterValues, registerSchema } from '@/lib/schemas/auth';

export function RegisterForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [redirecting, setRedirecting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<Partial<Record<FieldName, string>>>({});
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });
  const loading = pending || redirecting;

  const onSubmit = handleSubmit((values) => {
    setFailure(null);
    setServerErrors({});
    startTransition(async () => {
      const result = await registerAction(values);
      if (result.ok) {
        setRedirecting(true);
        router.replace('/rooms');
        router.refresh();
        return;
      }
      if (result.fieldErrors) setServerErrors(result.fieldErrors);
      else setFailure(result.message);
    });
  });

  return (
    <>
      {failure && <FormAlert className="mt-5">{failure}</FormAlert>}
      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
        <TextField
          id="email"
          type="email"
          label="Email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message ?? serverErrors.email}
          disabled={loading}
          {...register('email')}
        />
        <TextField
          id="username"
          label="Username"
          autoComplete="username"
          placeholder="alice_w"
          hint="3-20 characters: a-z, 0-9 and _"
          error={errors.username?.message ?? serverErrors.username}
          disabled={loading}
          {...register('username')}
        />
        <TextField
          id="password"
          type="password"
          label="Password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          hint="8+ characters"
          error={errors.password?.message ?? serverErrors.password}
          disabled={loading}
          {...register('password')}
        />
        <Button type="submit" className="w-full" loading={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </>
  );
}
