-- Site catalog photos removed from /gallery in admin (GALLERY_PHOTOS ids).
CREATE TABLE IF NOT EXISTS "GalleryPhotoHidden" (
    "photoId" TEXT NOT NULL,
    "hiddenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GalleryPhotoHidden_pkey" PRIMARY KEY ("photoId")
);
