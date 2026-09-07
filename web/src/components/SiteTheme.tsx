"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { isThemeExemptPath } from "@/lib/siteThemeValue";

function applySiteDarkClass(dark: boolean, pathname: string | null) {
  const on = dark && !isThemeExemptPath(pathname);
  document.documentElement.classList.toggle("site-dark", on);
}

/** Keep `<html class="site-dark">` in sync after client navigations. */
export default function SiteTheme({ dark }: { dark: boolean }) {
  const pathname = usePathname();

  useEffect(() => {
    applySiteDarkClass(dark, pathname);
  }, [dark, pathname]);

  return null;
}

/** True when the storefront is currently using the admin dark color palette. */
export function useSiteDarkClass(): boolean {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setDark(root.classList.contains("site-dark"));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return dark;
}
