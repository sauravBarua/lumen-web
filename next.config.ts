import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Set by the Dockerfile only: standalone output needs symlinks, which fail on some Windows setups.
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
};

export default nextConfig;
