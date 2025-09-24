import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  // 禁用 Next.js 热重载，由 nodemon 处理重编译
  reactStrictMode: false,
  // Configure for Replit environment
  serverExternalPackages: ['@prisma/client'],
  // Allow cross-origin requests for Replit proxy
  allowedDevOrigins: ['f81561b4-03d6-4284-88be-174420d2dab7-00-g127c3pfumcx.spock.replit.dev', '127.0.0.1'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'html.tailus.io',
      },
    ],
  },
  webpack: (config, { dev }) => {
    // Configure path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
    };
    return config;
  },

};

export default nextConfig;
