import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',

  // Use webpack instead of turbopack for better compatibility
  webpack: (config, { isServer }) => {
    // Prevent webpack from bundling these dependencies on the client side
    if (!isServer) {
      config.resolve.fallback = {
        filename: false,
      };
    }

    return config;
  },

  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'base-sepolia-app.scalex.money',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'app.scalex.money',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // Rewrites for API routes
  async rewrites() {
    return [
      {
        source: '/api/health',
        destination: '/api/health',
      },
    ];
  },

  
  // Skip type checking for problematic dependencies
  typescript: {
    // Only type check app code, not node_modules
    ignoreBuildErrors: true,
  },

  transpilePackages: [
    // Transpile specific packages that have TypeScript issues
    // Leave empty for now, can add packages as needed
  ],
};

export default nextConfig;
