import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DiscountUrgencyBanner from "@/components/discount/DiscountUrgencyBanner";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.URL || // Netlify
  process.env.DEPLOY_PRIME_URL || // Netlify previews
  "http://localhost:3000";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  title: "Voronyz — Advanced 3D Printed Footwear",
  description:
    "Futuristic footwear engineered with 3D scanning, TPU lattices, and performance uppers. Shop the V3 Slides and more.",
  metadataBase: new URL(siteUrl),
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Voronyz",
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon-32x32.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Voronyz — Advanced 3D Printed Footwear",
    description:
      "Futuristic footwear engineered with 3D scanning, TPU lattices, and performance uppers.",
    url: "/",
    siteName: "Voronyz",
    images: [
      { url: "/products/v3-slides/InShot_20260212_194352014.jpg", width: 1200, height: 630, alt: "Voronyz V3 Slides" },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Voronyz — Advanced 3D Printed Footwear",
    description:
      "Futuristic footwear engineered with 3D scanning, TPU lattices, and performance uppers.",
    images: ["/products/v3-slides/InShot_20260212_194352014.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      style={{ background: "#000000", backgroundColor: "#000000" }}
    >
      <head>
        {/* Paint black before CSS/JS so the logo splash never sits on a white frame. */}
        <style
          dangerouslySetInnerHTML={{
            __html:
              "html,body{background:#000!important;background-color:#000!important}",
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ background: "#000000", backgroundColor: "#000000" }}
        suppressHydrationWarning
      >
        <DiscountUrgencyBanner />
        <Suspense fallback={null}>
          <Header />
        </Suspense>
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
