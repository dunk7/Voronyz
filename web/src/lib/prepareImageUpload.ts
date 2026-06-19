import {
  AVATAR_MAX_BYTES,
  MESSAGE_ATTACHMENT_MAX_BYTES,
  inferMimeType,
  normalizeMimeType,
} from "@/lib/messageAttachment";

/** Netlify serverless request bodies are capped around 6 MB. */
export const UPLOAD_SAFE_MAX_BYTES = 5 * 1024 * 1024;

const HEIC_EXTENSIONS = /\.(heic|heif)$/i;
const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|heic|heif|bmp|tif?f)$/i;

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

async function convertHeicToJpeg(file: File): Promise<File> {
  const heic2any = (await import("heic2any")).default;
  const converted = await heic2any({
    blob: file,
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

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read photo."));
    };
    img.src = url;
  });
}

function canvasToJpegBlob(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
  });
}

async function compressRasterImage(
  file: File,
  options: { maxBytes: number; maxDimension: number; minQuality?: number }
): Promise<File> {
  const mime = normalizeMimeType(inferMimeType(file));
  if (mime === "image/gif") return file;
  if (file.size <= options.maxBytes && !isHeicUploadFile(file)) {
    const img = await loadImageFromFile(file).catch(() => null);
    if (!img) return file;
    if (
      Math.max(img.naturalWidth, img.naturalHeight) <= options.maxDimension
    ) {
      return file;
    }
  }

  const img = await loadImageFromFile(file);
  const longest = Math.max(img.naturalWidth, img.naturalHeight);
  const scale = Math.min(1, options.maxDimension / longest);
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, width, height);

  let quality = 0.92;
  const minQuality = options.minQuality ?? 0.55;
  let blob = await canvasToJpegBlob(canvas, quality);
  while (blob && blob.size > options.maxBytes && quality > minQuality) {
    quality -= 0.08;
    blob = await canvasToJpegBlob(canvas, quality);
  }

  if (!blob) return file;
  return new File([blob], replaceExtension(file.name, "jpg"), {
    type: "image/jpeg",
    lastModified: file.lastModified,
  });
}

export async function prepareMessageImage(file: File): Promise<File> {
  if (!isImageUploadFile(file)) return file;

  let prepared = file;
  if (isHeicUploadFile(file)) {
    prepared = await convertHeicToJpeg(file);
  }

  const targetBytes = Math.min(
    MESSAGE_ATTACHMENT_MAX_BYTES,
    UPLOAD_SAFE_MAX_BYTES
  );

  return compressRasterImage(prepared, {
    maxBytes: targetBytes,
    maxDimension: 4096,
  });
}

export async function prepareAvatarImage(file: File): Promise<File> {
  if (!isImageUploadFile(file)) return file;

  let prepared = file;
  if (isHeicUploadFile(file)) {
    prepared = await convertHeicToJpeg(file);
  }

  return compressRasterImage(prepared, {
    maxBytes: AVATAR_MAX_BYTES,
    maxDimension: 1024,
    minQuality: 0.6,
  });
}
