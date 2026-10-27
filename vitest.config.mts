import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
    env: {
      API_URL: 'http://localhost:3001',
      NEXT_PUBLIC_API_URL: 'http://localhost:3001',
      AUTH_SECRET: 'test-secret-test-secret-test-secret-1234',
    },
  },
});
