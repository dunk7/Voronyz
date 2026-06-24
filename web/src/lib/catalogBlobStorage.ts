import { getStore } from "@netlify/blobs";

export const CATALOG_BLOB_STORE = "catalog-assets";
export const MAGIKID_THUMB_BLOB_KEY = "magikid-shoes/thumbnail";
export const MAGIKID_THUMB_META_KEY = "magikid-shoes/thumbnail-meta";

export type CatalogImageMeta = {
  contentType: string;
  bytes: number;
  updatedAt: string;
};

export function getCatalogBlobStore() {
  return getStore({ name: CATALOG_BLOB_STORE, consistency: "strong" });
}
