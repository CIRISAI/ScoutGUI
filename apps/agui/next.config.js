/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages will use @cloudflare/next-on-pages adapter
  // No need for static export - Cloudflare handles SSR/ISR

  // Image optimization configuration for Cloudflare
  images: {
    unoptimized: true, // Cloudflare handles image optimization
  },

  // Cache control headers to prevent stale JavaScript chunks
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_SCOUT_API_URL: process.env.NEXT_PUBLIC_SCOUT_API_URL || 'https://scoutapi.ciris.ai/api/scout-remote-test-dahrb9/v1',
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://scoutapi.ciris.ai/api/scout-remote-test-dahrb9/v1',
  },

  // Webpack configuration for Cloudflare Workers compatibility
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'fs' module on the client to prevent this error on build --> Error: Can't resolve 'fs'
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
