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
    RICE_CALL_API_URL: process.env.RICE_CALL_API_URL || '',
    RICE_CALL_WS_URL: process.env.RICE_CALL_WS_URL || '',
    RICE_CALL_DOCS_BASE_URL: process.env.RICE_CALL_DOCS_BASE_URL || '',
    RICE_CALL_ERROR_SUBMISSION_URL: process.env.RICE_CALL_ERROR_SUBMISSION_URL || '',
  },
  devIndicators: false,
};

export default nextConfig;
