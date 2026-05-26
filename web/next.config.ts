import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // Keep for Netlify compatibility
  },
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return [
      { source: "/uploads", destination: "/upload", permanent: true },
      { source: "/uploads/:path*", destination: "/upload", permanent: true },
    ];
  },
};

export default nextConfig;
