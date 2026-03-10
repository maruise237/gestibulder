import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';
import path from 'path';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
});

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config) => {
    config.resolve.modules.push(path.resolve(__dirname, 'node_modules'));
    return config;
  },
  turbopack: {
    root: __dirname,
  },
};

export default withPWA(nextConfig);
