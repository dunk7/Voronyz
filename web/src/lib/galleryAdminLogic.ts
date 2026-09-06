/**
 * Gallery admin: reject and delete are the same action.
 * Both remove the photo from /gallery (and from the admin list).
 */

export type GalleryPhotoSource = "catalog" | "submission";

/** Only approved photos appear on the public /gallery page. */
export function isShownOnPublicGallery(status: string): boolean {
  return status === "approved";
}

/**
 * PATCH status "rejected" is treated as a removal, the same as DELETE.
 * Customer uploads are deleted; site catalog photos are hidden.
 */
export function galleryStatusChangeIsRemoval(status: string): boolean {
  return status === "rejected";
}

/** Pending review photos use Reject; published / site photos use Delete. */
export function shouldShowGalleryRejectButton(
  source: GalleryPhotoSource,
  status: string
): boolean {
  return source === "submission" && status === "pending";
}

export function shouldShowGalleryDeleteButton(
  source: GalleryPhotoSource,
  status: string
): boolean {
  if (source === "catalog") return true;
  return status !== "pending";
}
