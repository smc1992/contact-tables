/** @type {import('next').NextConfig} */
const withPlugins = require('next-compose-plugins');
// Explizite Liste der zu transpilierenden Module
const withTM = require('next-transpile-modules')(['highlight.js', 'lowlight', 'react', 'react-dom']);

const nextConfig = {
  reactStrictMode: true,
  // Optimierte Konfiguration für Next.js 14 mit Netlify
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
  // Konfiguration für serverseitige Rendering und statischen Export
  trailingSlash: true,
  // Explizit Admin-Seiten vom statischen Export ausschließen
  experimental: {
    // Ermöglicht die Verwendung von runtime-Konfigurationen in Seiten
  },
  // Exclude admin pages from static export
  exportPathMap: async function (defaultPathMap, { dev, dir, outDir, distDir, buildId }) {
    const filteredPathMap = {};
    
    // Filter out admin pages from static export
    for (const path in defaultPathMap) {
      if (!path.startsWith('/admin')) {
        filteredPathMap[path] = defaultPathMap[path];
      }
    }
    
    return filteredPathMap;
  },
  // Explizit festlegen, welche Seiten serverseitig gerendert werden sollen
  serverRuntimeConfig: {
    // Serverseitige Konfiguration hier
  },
  publicRuntimeConfig: {
    // Öffentliche Konfiguration hier
  },
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  },
  // Kombinierte webpack-Konfiguration
  webpack: (config, { dev, isServer }) => {
    // Disable webpack caching in development mode to troubleshoot build issues
    if (dev) {
      config.cache = false;
    }
    
    // Pfad-Aliase für alle Umgebungen (Server und Client)
    config.resolve.alias = {
      ...config.resolve.alias,
      '@/backend': require('path').resolve(__dirname, './src/backend'),
      '@/utils': require('path').resolve(__dirname, './src/utils'),
    };
    
    // Transpile ES6 modules to CommonJS for compatibility
    if (!isServer) {
      config.module.rules.push({
        test: /\.(js|jsx)$/,
        exclude: /node_modules\/(?!(highlight\.js|lowlight)\/)/, 
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['next/babel']
          }
        }
      });

      // Spezielle Behandlung für highlight.js und lowlight
      config.module.rules.push({
        test: /\.js$/,
        include: [/node_modules\/highlight\.js/, /node_modules\/lowlight/],
        use: {
          loader: 'babel-loader',
          options: {
            presets: [['@babel/preset-env', { modules: 'commonjs' }]]
          }
        }
      });

      // Füge explizite Fallbacks für React-Module hinzu
      config.resolve.alias = {
        ...config.resolve.alias,
        'react/jsx-runtime': require.resolve('react/jsx-runtime'),
        'react/jsx-dev-runtime': require.resolve('react/jsx-dev-runtime'),
      };
      
      // Füge Fallbacks für React-Module hinzu
      config.resolve.fallback = {
        ...config.resolve.fallback,
        react: require.resolve('react'),
        'react-dom': require.resolve('react-dom'),
      };
    }
    
    return config;
  },
}

module.exports = withPlugins([
  [withTM]
], nextConfig);