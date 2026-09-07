/** Storefront stays light unless an admin turns dark mode on. */
export const SITE_DARK_MODE_BY_DEFAULT = false;

export function parseSiteDarkModeValue(value: string | null | undefined): boolean {
  if (value == null) return SITE_DARK_MODE_BY_DEFAULT;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return SITE_DARK_MODE_BY_DEFAULT;
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "dark";
}

export function isThemeExemptPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === "/message" || pathname.startsWith("/message/");
}
