"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { shouldApplySiteDarkClass } from "@/lib/siteThemeValue";

export const SITE_THEME_EVENT = "voronyz-theme";
const SITE_THEME_CHANNEL = "voronyz-theme";

export function dispatchSiteTheme(dark: boolean) {
  window.dispatchEvent(new CustomEvent(SITE_THEME_EVENT, { detail: { dark } }));
  try {
    const channel = new BroadcastChannel(SITE_THEME_CHANNEL);
    channel.postMessage({ dark });
    channel.close();
  } catch {
    /* BroadcastChannel unavailable */
  }
}

function applySiteDarkClass(dark: boolean, pathname: string | null) {
  document.documentElement.classList.toggle(
    "site-dark",
    shouldApplySiteDarkClass(dark, pathname)
  );
}

async function fetchSiteTheme(): Promise<boolean | null> {
  try {
    const res = await fetch("/api/site-theme", { cache: "no-store" });
    const data = await res.json();
    return typeof data.dark === "boolean" ? data.dark : null;
  } catch {
    return null;
  }
}

/** Keep `<html class="site-dark">` in sync after client navigations and admin toggles. */
export default function SiteTheme({ dark: initialDark }: { dark: boolean }) {
  const pathname = usePathname();
  const [dark, setDark] = useState(initialDark);
  const fetchGen = useRef(0);

  useEffect(() => {
    const onTheme = (event: Event) => {
      const detail = (event as CustomEvent<{ dark?: unknown }>).detail;
      if (detail && typeof detail.dark === "boolean") {
        // Drop in-flight polls so they cannot overwrite a live admin toggle.
        fetchGen.current += 1;
        setDark(detail.dark);
      }
    };
    window.addEventListener(SITE_THEME_EVENT, onTheme);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(SITE_THEME_CHANNEL);
      channel.onmessage = (event: MessageEvent<{ dark?: unknown }>) => {
        if (typeof event.data?.dark === "boolean") {
          fetchGen.current += 1;
          setDark(event.data.dark);
        }
      };
    } catch {
      /* BroadcastChannel unavailable */
    }

    return () => {
      window.removeEventListener(SITE_THEME_EVENT, onTheme);
      channel?.close();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const gen = ++fetchGen.current;
      const next = await fetchSiteTheme();
      if (!cancelled && gen === fetchGen.current && next !== null) setDark(next);
    };
    load();
    const onVis = () => {
      if (document.visibilityState === "visible") load();
    };
    window.addEventListener("focus", load);
    document.addEventListener("visibilitychange", onVis);
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 2000);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", load);
      document.removeEventListener("visibilitychange", onVis);
      window.clearInterval(poll);
    };
  }, [pathname]);

  useLayoutEffect(() => {
    const sync = () => applySiteDarkClass(dark, pathname);
    sync();

    // Next.js re-renders `<html className>` and can strip a classList toggle.
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      const on = shouldApplySiteDarkClass(dark, pathname);
      if (root.classList.contains("site-dark") !== on) sync();
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
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
