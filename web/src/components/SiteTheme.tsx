"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { isThemeExemptPath } from "@/lib/siteThemeValue";

export const SITE_THEME_EVENT = "voronyz-theme";

export function dispatchSiteTheme(dark: boolean) {
  window.dispatchEvent(new CustomEvent(SITE_THEME_EVENT, { detail: { dark } }));
}

function applySiteDarkClass(dark: boolean, pathname: string | null) {
  const on = dark && !isThemeExemptPath(pathname);
  document.documentElement.classList.toggle("site-dark", on);
}

/** Keep `<html class="site-dark">` in sync after client navigations and admin toggles. */
export default function SiteTheme({ dark: initialDark }: { dark: boolean }) {
  const pathname = usePathname();
  const [dark, setDark] = useState(initialDark);

  useEffect(() => {
    setDark(initialDark);
  }, [initialDark]);

  useEffect(() => {
    const onTheme = (event: Event) => {
      const detail = (event as CustomEvent<{ dark?: unknown }>).detail;
      if (detail && typeof detail.dark === "boolean") setDark(detail.dark);
    };
    window.addEventListener(SITE_THEME_EVENT, onTheme);
    return () => window.removeEventListener(SITE_THEME_EVENT, onTheme);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/site-theme")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && typeof data.dark === "boolean") setDark(data.dark);
      })
      .catch(() => {
        /* keep last known value */
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

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
