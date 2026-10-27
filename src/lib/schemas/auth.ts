import { z } from 'zod';

// Form schemas, aligned by hand with the API contract (never imported across repos).
const email = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .pipe(z.email('Enter a valid email address'));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required').max(72, 'Password is too long'),
});

export const registerSchema = z.object({
  email,
  username: z
    .string()
    .trim()
    .regex(
      /^[a-z0-9_]{3,20}$/,
      'Only lowercase letters, numbers and _ are allowed (3-20 characters)',
    ),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters'),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
