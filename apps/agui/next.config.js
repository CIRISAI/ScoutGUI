/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages will use @cloudflare/next-on-pages adapter
  // No need for static export - Cloudflare handles SSR/ISR

  // Image optimization configuration for Cloudflare
  images: {
    unoptimized: true, // Cloudflare handles image optimization
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_SCOUT_API_URL: process.env.NEXT_PUBLIC_SCOUT_API_URL || 'https://scoutapi.ciris.ai',
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://scoutapi.ciris.ai',
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
