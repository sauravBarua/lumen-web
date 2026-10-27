import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    API_URL: z.url(),
    AUTH_SECRET: z.string().min(32),
  },
  client: {
    NEXT_PUBLIC_API_URL: z.url(),
  },
  clientPrefix: 'NEXT_PUBLIC_',
  // Next only inlines literal process.env.X references, so each variable is listed explicitly.
  runtimeEnv: {
    API_URL: process.env.API_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
