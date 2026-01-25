/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    domains: ['lh3.googleusercontent.com', 'maps.googleapis.com', 'efmbzrmroyetcqxcwxka.supabase.co', 'images.unsplash.com', 'res.cloudinary.com'],
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  trailingSlash: true,
  // experimental: {
  //   outputFileTracingExcludes: {
  //     '*': ['**/node_modules/@prisma/**'],
  //   },
  //   serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  // },
  exportPathMap: async function (defaultPathMap, { dev, dir, outDir, distDir, buildId }) {
    const filteredPathMap = {};
    
    for (const path in defaultPathMap) {
      if (!path.startsWith('/admin')) {
        filteredPathMap[path] = defaultPathMap[path];
      }
    }
    
    return filteredPathMap;
  },
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
    }
    
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/backend': require('path').resolve(__dirname, './src/backend'),
      '@/utils': require('path').resolve(__dirname, './src/utils'),
    };
    
    return config;
  },
}

module.exports = nextConfig;
