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
    const influencerCaseRedirects = [
      "aryan",
      "aryan10",
      "pedro",
      "nicole",
      "andy",
      "maximus",
      "chud",
      "emptyaus",
      "fam",
      "superdeal",
      "super20",
    ].flatMap((slug) => {
      const titled = slug.charAt(0).toUpperCase() + slug.slice(1);
      if (titled === slug) return [];
      return [
        {
          source: `/${titled}`,
          destination: `/${slug}`,
          permanent: false,
        },
      ];
    });

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
      ...influencerCaseRedirects,
    ];
  },
};

export default nextConfig;
