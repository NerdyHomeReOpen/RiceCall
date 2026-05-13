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
    DOCS_BASE_URL: process.env.DOCS_BASE_URL || '',
    ERROR_SUBMISSION_URL: process.env.ERROR_SUBMISSION_URL || '',
  },
  devIndicators: false,
};

export default nextConfig;
