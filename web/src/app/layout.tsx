import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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

export const metadata: Metadata = {
  title: "Voronyz — Advanced 3D Printed Footwear",
  description:
    "Futuristic footwear engineered with 3D scanning, TPU lattices, and performance uppers. Shop the V3 Slides and more.",
  metadataBase: new URL(siteUrl),
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Voronyz — Advanced 3D Printed Footwear",
    description:
      "Futuristic footwear engineered with 3D scanning, TPU lattices, and performance uppers.",
    url: "/",
    siteName: "Voronyz",
    images: [
      { url: "/v3-front.jpg", width: 1200, height: 630, alt: "Voronyz V3 Slides" },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Voronyz — Advanced 3D Printed Footwear",
    description:
      "Futuristic footwear engineered with 3D scanning, TPU lattices, and performance uppers.",
    images: ["/v3-front.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Suspense fallback={null}>
          <Header />
        </Suspense>
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
