/** @type {import('next').NextConfig} */
const withPlugins = require('next-compose-plugins');
// Explizite Liste der zu transpilierenden Module
const withTM = require('next-transpile-modules')(['highlight.js', 'lowlight', 'react', 'react-dom']);

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
  // Externe Module konfigurieren
  experimental: {
    esmExternals: 'loose',
  },
  webpack: (config, { dev, isServer }) => {
    // Disable webpack caching in development mode to troubleshoot build issues
    if (dev) {
      config.cache = false;
    }
    
    // Entferne externals für react/jsx-runtime
    if (!isServer) {
      // Stelle sicher, dass keine externals für React gesetzt sind
      if (config.externals) {
        if (Array.isArray(config.externals)) {
          config.externals = config.externals.filter(external => {
            return typeof external !== 'object' || 
                  (external && !external.react && !external['react-dom'] && !external['react/jsx-runtime']);
          });
        } else if (typeof config.externals === 'object') {
          const { react, 'react-dom': reactDom, 'react/jsx-runtime': jsxRuntime, ...restExternals } = config.externals;
          config.externals = restExternals;
        }
      }
    }
    
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

      // Spezielle Behandlung für highlight.js
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

      // Stellen Sie sicher, dass React und JSX Runtime korrekt geladen werden
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...config.resolve.alias,
        'react': require.resolve('react'),
        'react-dom': require.resolve('react-dom'),
        'react/jsx-runtime': require.resolve('react/jsx-runtime'),
        'react/jsx-dev-runtime': require.resolve('react/jsx-dev-runtime')
      };
      
      // Füge explizite Module-Pfade für React hinzu
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'react': require.resolve('react'),
        'react-dom': require.resolve('react-dom'),
        'react/jsx-runtime': require.resolve('react/jsx-runtime')
      };
    }
    
    return config;
  },
}

module.exports = withPlugins([
  [withTM]
], nextConfig);