import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true, // Disable Next.js Image Optimization for static export
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
