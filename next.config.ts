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
  env: {
    API_URL: process.env.API_URL || '',
    WS_URL: process.env.WS_URL || '',
    CROWDIN_DISTRIBUTION_HASH: process.env.CROWDIN_DISTRIBUTION_HASH || '',
    ERROR_SUBMISSION_URL: process.env.ERROR_SUBMISSION_URL || '',
  },
  devIndicators: false,
};

export default nextConfig;
