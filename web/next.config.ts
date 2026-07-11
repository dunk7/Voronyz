import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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
