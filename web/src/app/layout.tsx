import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
    "Futuristic footwear engineered with 3D scanning, TPU 95A lattices, and performance uppers. Shop the V3 Slides and more.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://voronyz.local"),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "Voronyz — Advanced 3D Printed Footwear",
    description:
      "Futuristic footwear engineered with 3D scanning, TPU 95A lattices, and performance uppers.",
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
      "Futuristic footwear engineered with 3D scanning, TPU 95A lattices, and performance uppers.",
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
      >
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
