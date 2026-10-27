import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    agentUpgrade: 'security' as any,
  },
};

export default nextConfig;
