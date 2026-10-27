import createClient from 'openapi-fetch';
import { env } from '@/env';
import type { paths } from './schema';

/** Typed API client for server code (Server Actions, Auth.js callbacks). */
export const serverApi = createClient<paths>({ baseUrl: env.API_URL });
