import { getConfiguredBlobStore } from "@/lib/netlifyBlobStore";

export const CATALOG_BLOB_STORE = "catalog-assets";

export type CatalogImageMeta = {
  contentType: string;
  bytes: number;
  updatedAt: string;
};

export function getCatalogBlobStore() {
  return getConfiguredBlobStore(CATALOG_BLOB_STORE);
}
