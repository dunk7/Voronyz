import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DiscountUrgencyBanner from "@/components/discount/DiscountUrgencyBanner";
import InitialSplash from "@/components/ui/InitialSplash";
import SiteTheme from "@/components/SiteTheme";
import { getSiteDarkMode } from "@/lib/siteTheme";

/** Black + white-logo splash for iOS home-screen shortcuts (avoids the default white card + icon). */
const appleStartupImages = [
  {
    url: "/splash/apple-splash-640-1136.png",
    media:
      "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
  },
  {
    url: "/splash/apple-splash-750-1334.png",
    media:
      "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
  },
  {
    url: "/splash/apple-splash-828-1792.png",
    media:
      "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)",
  },
  {
    url: "/splash/apple-splash-1125-2436.png",
    media:
      "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  {
    url: "/splash/apple-splash-1170-2532.png",
    media:
      "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  {
    url: "/splash/apple-splash-1179-2556.png",
    media:
      "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  {
    url: "/splash/apple-splash-1284-2778.png",
    media:
      "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  {
    url: "/splash/apple-splash-1290-2796.png",
    media:
      "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  {
    url: "/splash/apple-splash-1206-2622.png",
    media:
      "(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
  {
    url: "/splash/apple-splash-1320-2868.png",
    media:
      "(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
  },
];

export const dynamic = "force-dynamic";

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
    startupImage: appleStartupImages,
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

function siteThemeBootScript(dark: boolean): string {
  return `(function(){try{var d=${dark ? "1" : "0"};var p=location.pathname;if(d==="1"&&p.indexOf("/orders")!==0&&p.indexOf("/message")!==0){document.documentElement.classList.add("site-dark");}}catch(e){}})();`;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const darkMode = await getSiteDarkMode();

  return (
    <html
      lang="en"
      style={{ background: "#000000", colorScheme: "dark" }}
      suppressHydrationWarning
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ background: "#000000" }}
        suppressHydrationWarning
      >
        <script
          dangerouslySetInnerHTML={{ __html: siteThemeBootScript(darkMode) }}
        />
        {/*
          Inline critical splash CSS so the first paint is full-bleed black
          even before globals.css / Tailwind is available.
        */}
        <style
          dangerouslySetInnerHTML={{
            __html: `html,body{background:#000!important;background-color:#000!important;color-scheme:dark}#voronyz-splash{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:#000;width:100%;height:100%;min-height:100dvh}#voronyz-splash img{width:72px!important;height:72px!important;max-width:72px!important;background:transparent!important}`,
          }}
        />
        <noscript>
          <style
            dangerouslySetInnerHTML={{
              __html: `#voronyz-splash{display:none!important}`,
            }}
          />
        </noscript>
        <SiteTheme dark={darkMode} />
        <InitialSplash />
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
