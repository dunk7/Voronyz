/** Logical storage path key (file bytes live in Netlify Blobs). */
export function buildStlStorageKey(submissionId: string, fileName: string): string {
  const safe = fileName.replace(/[^\w.\-]+/g, "_");
  return `${submissionId}/${safe}`;
}
