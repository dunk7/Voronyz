import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // Keep for Netlify compatibility
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
