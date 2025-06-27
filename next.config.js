/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com', 'maps.googleapis.com'],
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

module.exports = nextConfig