/** @type {import('next').NextConfig} */
const withPlugins = require('next-compose-plugins');
const withTM = require('next-transpile-modules')(['rc-util', 'rc-picker', '@rc-component/util', '@rc-component/trigger', 'rc-table', 'rc-tree', 'rc-select', 'rc-dropdown', 'rc-menu', 'rc-motion', 'rc-notification', 'rc-tooltip', 'rc-tree-select', '@ant-design/icons-svg']);

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com', 'maps.googleapis.com', 'efmbzrmroyetcqxcwxka.supabase.co', 'images.unsplash.com', 'res.cloudinary.com'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  },
  webpack: (config, { dev }) => {
    // Disable webpack caching in development mode to troubleshoot build issues
    if (dev) {
      config.cache = false;
    }
    return config;
  },
}

module.exports = withPlugins([
  [withTM]
], nextConfig);