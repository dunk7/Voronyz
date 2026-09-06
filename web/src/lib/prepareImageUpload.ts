import {
  AVATAR_MAX_BYTES,
  MESSAGE_ATTACHMENT_MAX_BYTES,
  inferMimeType,
  isAllowedAvatarMimeType,
  normalizeMimeType,
  sniffImageMimeType,
} from "./messageAttachment";

const HEIC_EXTENSIONS = /\.(heic|heif)$/i;
const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|heic|heif|bmp|tif?f|jfif|pjpeg|pjp)$/i;
const LARGE_IMAGE_MAX_DIMENSION = 8192;

export function isImageUploadFile(file: File): boolean {
  const mime = normalizeMimeType(inferMimeType(file));
  if (mime.startsWith("image/")) return true;
  return IMAGE_EXTENSIONS.test(file.name);
}

export function isHeicUploadFile(file: File): boolean {
  const mime = normalizeMimeType(inferMimeType(file));
  if (mime === "image/heic" || mime === "image/heif") return true;
  return HEIC_EXTENSIONS.test(file.name);
}

function replaceExtension(fileName: string, ext: string): string {
  const base = fileName.replace(/\.[^./\\]+$/, "") || "photo";
  return `${base}.${ext}`;
}

function extensionForImageMime(mime: string): string {
  switch (normalizeMimeType(mime)) {
    case "image/png":
      return "png";
    case "image/gif":
      return "gif";
    case "image/webp":
      return "webp";
    case "image/heic":
      return "heic";
    case "image/heif":
      return "heif";
    case "image/bmp":
      return "bmp";
    default:
      return "jpg";
  }
}

function fileWithMime(file: File, mime: string): File {
  const type = normalizeMimeType(mime);
  const hasExt = /\.[^./\\]+$/.test(file.name);
  const name = hasExt
    ? file.name
    : replaceExtension(file.name || "photo", extensionForImageMime(type));
  if (file.type === type && name === file.name) {
    return file;
  }
  return new File([file], name, {
    type,
    lastModified: file.lastModified,
  });
}

async function sniffFileImageMime(file: File): Promise<string | null> {
  try {
    const header = await file.slice(0, 64).arrayBuffer();
    return sniffImageMimeType(header);
  } catch {
    return null;
  }
}

async function canonicalizeImageFile(file: File): Promise<File> {
  const sniffed = await sniffFileImageMime(file);
  const inferred = normalizeMimeType(inferMimeType(file));
  const mime = sniffed || inferred;
  if (!mime.startsWith("image/")) return file;
  return fileWithMime(file, mime);
}

type DecodedImage = {
  width: number;
  height: number;
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  close: () => void;
};

function loadImageElement(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    const finish = (error?: Error) => {
      URL.revokeObjectURL(url);
      if (error) reject(error);
      else resolve(img);
    };
    img.onload = () => {
      if (typeof img.decode === "function") {
        img
          .decode()
          .then(() => finish())
          .catch(() => finish());
        return;
      }
      finish();
    };
    img.onerror = () => finish(new Error("Could not read photo."));
    img.decoding = "async";
    img.src = url;
  });
}

function decodedFromBitmap(bitmap: ImageBitmap): DecodedImage {
  return {
    width: bitmap.width,
    height: bitmap.height,
    draw: (ctx, width, height) => ctx.drawImage(bitmap, 0, 0, width, height),
    close: () => bitmap.close(),
  };
}

function decodedFromElement(img: HTMLImageElement): DecodedImage | null {
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  if (!width || !height) return null;
  return {
    width,
    height,
    draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
    close: () => undefined,
  };
}

async function decodeImage(file: Blob): Promise<DecodedImage | null> {
  if (typeof createImageBitmap === "function") {
    try {
      return decodedFromBitmap(await createImageBitmap(file));
    } catch {
      // Some browsers reject a blob whose MIME doesn't match the bytes.
    }
  }

  if (typeof Image === "undefined") return null;

  try {
    const img = await loadImageElement(file);
    return decodedFromElement(img);
  } catch {
    return null;
  }
}

async function decodeImageFile(file: File): Promise<DecodedImage | null> {
  const sniffed = await sniffFileImageMime(file);
  const inferred = normalizeMimeType(inferMimeType(file));
  const mime = sniffed || inferred;
  const typed =
    mime.startsWith("image/") && normalizeMimeType(file.type || "") !== mime
      ? file.slice(0, file.size, mime)
      : file;

  return (await decodeImage(typed)) ?? (await decodeImage(file));
}

function canvasToJpegBlob(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
  });
}

async function rasterizeToJpeg(
  file: File,
  maxDimension: number,
  quality = 0.9
): Promise<File | null> {
  const decoded = await decodeImageFile(file);
  if (!decoded) return null;

  const longest = Math.max(decoded.width, decoded.height);
  const scale = longest > maxDimension ? maxDimension / longest : 1;
  const width = Math.max(1, Math.round(decoded.width * scale));
  const height = Math.max(1, Math.round(decoded.height * scale));

  try {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    decoded.draw(ctx, width, height);
    const blob = await canvasToJpegBlob(canvas, quality);
    if (!blob) return null;
    return new File([blob], replaceExtension(file.name, "jpg"), {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } finally {
    decoded.close();
  }
}

async function convertHeicToJpeg(file: File): Promise<File> {
  const typed = fileWithMime(file, "image/heic");
  const native = await rasterizeToJpeg(typed, LARGE_IMAGE_MAX_DIMENSION, 0.88);
  if (native) return native;

  const heic2any = (await import("heic2any")).default;
  const converted = await heic2any({
    blob: typed,
    toType: "image/jpeg",
    quality: 0.88,
  });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  if (!(blob instanceof Blob)) {
    throw new Error("Could not convert photo.");
  }
  return new File([blob], replaceExtension(file.name, "jpg"), {
    type: "image/jpeg",
    lastModified: file.lastModified,
  });
}

async function downscaleLargeImage(
  file: File,
  maxDimension: number
): Promise<File> {
  const decoded = await decodeImageFile(file);
  if (!decoded) return file;
  const longest = Math.max(decoded.width, decoded.height);
  if (longest <= maxDimension) {
    decoded.close();
    return file;
  }
  decoded.close();
  return (await rasterizeToJpeg(file, maxDimension)) ?? file;
}

async function convertIfHeic(file: File): Promise<File> {
  const sniffed = await sniffFileImageMime(file);
  const isHeic =
    sniffed === "image/heic" ||
    sniffed === "image/heif" ||
    (!sniffed && isHeicUploadFile(file));
  if (!isHeic) return file;
  return convertHeicToJpeg(file);
}

export async function prepareMessageImage(file: File): Promise<File> {
  if (!isImageUploadFile(file) && !(await sniffFileImageMime(file))) {
    return file;
  }

  let prepared = await canonicalizeImageFile(file);
  prepared = await convertIfHeic(prepared);

  if (prepared.size > MESSAGE_ATTACHMENT_MAX_BYTES) {
    throw new Error("Image is too large.");
  }

  try {
    return await downscaleLargeImage(prepared, LARGE_IMAGE_MAX_DIMENSION);
  } catch {
    return prepared;
  }
}

export async function prepareAvatarImage(file: File): Promise<File> {
  let prepared = await canonicalizeImageFile(file);
  prepared = await convertIfHeic(prepared);

  const mime = normalizeMimeType(inferMimeType(prepared));
  const allowed = isAllowedAvatarMimeType(mime);

  if (prepared.size <= AVATAR_MAX_BYTES && allowed) {
    const decoded = await decodeImageFile(prepared);
    if (!decoded) return prepared;
    const smallEnough = Math.max(decoded.width, decoded.height) <= 1024;
    decoded.close();
    if (smallEnough) return prepared;
  }

  const jpeg = await rasterizeToJpeg(prepared, 1024);
  if (jpeg && jpeg.size <= AVATAR_MAX_BYTES) return jpeg;

  if (prepared.size <= AVATAR_MAX_BYTES && allowed) return prepared;

  throw new Error("Could not prepare that photo. Try a JPEG or PNG under 2 MB.");
}

const GALLERY_REVIEW_MAX_BYTES = 8 * 1024 * 1024;
const GALLERY_REVIEW_MAX_DIMENSION = 2048;

/** Prepare a customer review photo for /gallery upload. */
export async function prepareGalleryReviewImage(file: File): Promise<File> {
  const sniffed = await sniffFileImageMime(file);
  if (!isImageUploadFile(file) && !sniffed) {
    throw new Error("Please choose a JPEG, PNG, WebP, or HEIC photo.");
  }

  let prepared = await canonicalizeImageFile(file);
  prepared = await convertIfHeic(prepared);
  prepared = await downscaleLargeImage(prepared, GALLERY_REVIEW_MAX_DIMENSION);

  if (prepared.size > GALLERY_REVIEW_MAX_BYTES) {
    throw new Error("Photo is too large after compression. Try a smaller image.");
  }

  return prepared;
}
