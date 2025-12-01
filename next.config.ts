import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  basePath: '',
  assetPrefix: '',
  trailingSlash: false,
  output: 'export',
  env: {},
  devIndicators: false,
};

export default nextConfig;
