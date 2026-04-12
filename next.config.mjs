import nextPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  serverExternalPackages: ['bcryptjs']
};

const withPWA = nextPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  fallbacks: {
    document: '/offline.html'
  }
});

const isDev = process.env.NODE_ENV === 'development';

// In dev we avoid wrapping with next-pwa. Even when "disable" is true, the wrapper can
// still inject Webpack config which conflicts with Turbopack and can cause flaky .next artifacts.
export default isDev ? nextConfig : withPWA(nextConfig);
