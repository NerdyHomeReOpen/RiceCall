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
    MAIN_SERVICE_URL: process.env.MAIN_SERVICE_URL || '',
    MAIN_SERVICE_WS_URL: process.env.MAIN_SERVICE_WS_URL || '',
    DOCS_BASE_URL: process.env.DOCS_BASE_URL || '',
    ERROR_SUBMISSION_URL: process.env.ERROR_SUBMISSION_URL || '',
  },
  devIndicators: false,
};

export default nextConfig;
