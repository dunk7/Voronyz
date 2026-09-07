/** Regular (light) storefront unless an admin turns dark mode on. */
export const SITE_DARK_MODE_BY_DEFAULT = false;

export function parseSiteDarkModeValue(value: string | null | undefined): boolean {
  if (value == null) return SITE_DARK_MODE_BY_DEFAULT;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return SITE_DARK_MODE_BY_DEFAULT;
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "dark";
}

export function isThemeExemptPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return (
    pathname === "/orders" ||
    pathname.startsWith("/orders/") ||
    pathname === "/message" ||
    pathname.startsWith("/message/")
  );
}

/** Shop pages follow the admin setting; /orders and /message keep their own colors. */
export function shouldApplySiteDarkClass(
  dark: boolean,
  pathname: string | null | undefined
): boolean {
  return Boolean(dark) && !isThemeExemptPath(pathname);
}

/**
 * Inline boot script so `site-dark` is applied (or cleared) before paint.
 * Uses real booleans — a number compared with `==="1"` never matches.
 */
export function siteThemeBootScript(dark: boolean): string {
  return `(function(){try{var dark=${dark ? "true" : "false"};var p=location.pathname||"";var exempt=p==="/orders"||p.indexOf("/orders/")===0||p==="/message"||p.indexOf("/message/")===0;if(dark&&!exempt){document.documentElement.classList.add("site-dark");}else{document.documentElement.classList.remove("site-dark");}}catch(e){}})();`;
}
