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
    // Do not add Title-case → lowercase redirects for discount shortlinks.
    // On Netlify/Next those match case-insensitively, so /aryan → /aryan loops forever.
    // Case is already normalized in app/[code] via getInfluencerLinkBySlug().
    return [
      { source: "/uploads", destination: "/upload", permanent: true },
      { source: "/uploads/:path*", destination: "/upload", permanent: true },
      { source: "/apparel/sweats", destination: "/apparel/joggers", permanent: true },
      { source: "/apparel/pants", destination: "/apparel/joggers", permanent: true },
      // Removed pants / sweats products — only joggers remains.
      {
        source: "/products/voronyz-technical-pants",
        destination: "/products/voronyz-joggers",
        permanent: true,
      },
      {
        source: "/products/voronyz-lounge-sweats",
        destination: "/products/voronyz-joggers",
        permanent: true,
      },
      // Removed accessory listings — redirect to Accessories hub.
      {
        source: "/products/voronyz-necklace",
        destination: "/apparel/accessories",
        permanent: true,
      },
      {
        source: "/products/voronyz-keychain",
        destination: "/apparel/accessories",
        permanent: true,
      },
      {
        source: "/products/voronyz-rc-car-stickers",
        destination: "/apparel/accessories",
        permanent: true,
      },
      {
        source: "/products/voronyz-charm-bracelet",
        destination: "/apparel/accessories",
        permanent: true,
      },
      {
        source: "/products/voronyz-lattice-shoe-trees",
        destination: "/apparel/accessories",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
