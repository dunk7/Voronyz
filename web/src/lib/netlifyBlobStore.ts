import { getStore } from "@netlify/blobs";

/**
 * Netlify Blobs store with explicit credentials when available.
 * Auto-injected context works on Netlify Functions v2, but Next.js routes
 * sometimes need NETLIFY_SITE_ID + NETLIFY_AUTH_TOKEN (see migrate script).
 */
export function getConfiguredBlobStore(name: string) {
  const siteID = process.env.NETLIFY_SITE_ID?.trim();
  const token =
    process.env.NETLIFY_AUTH_TOKEN?.trim() ??
    process.env.NETLIFY_BLOBS_TOKEN?.trim();

  if (siteID && token) {
    return getStore({ name, siteID, token, consistency: "strong" });
  }

  return getStore({ name, consistency: "strong" });
}
