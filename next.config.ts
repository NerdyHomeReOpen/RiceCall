import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: ['localhost'],
    // 如果你之後有其他網域也要加在這裡
    // 例如: 'your-production-domain.com'
    unoptimized: true,
  },
  basePath: '',
  assetPrefix: '',
  trailingSlash: false,
  output: 'export',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    NEXT_PUBLIC_CROWDIN_DISTRIBUTION_HASH: process.env.NEXT_PUBLIC_CROWDIN_DISTRIBUTION_HASH,
  },
};

export default nextConfig;
