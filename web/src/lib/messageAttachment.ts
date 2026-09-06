/** ~2 GB (fits signed 32-bit integer column). */
export const MESSAGE_ATTACHMENT_MAX_BYTES = 2 * 1024 * 1024 * 1024 - 1;
export const MESSAGE_ATTACHMENT_CHUNK_BYTES = 4 * 1024 * 1024;
export const DIRECT_UPLOAD_MAX_BYTES = 0;
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

const AVATAR_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const GENERIC_MIME_TYPES = new Set([
  "",
  "application/octet-stream",
  "binary/octet-stream",
  "application/unknown",
  "application/x-download",
  "application/force-download",
]);

const MIME_ALIASES: Record<string, string> = {
  "image/jpg": "image/jpeg",
  "image/pjpeg": "image/jpeg",
  "image/x-png": "image/png",
  "image/x-citrix-png": "image/png",
  "image/x-citrix-jpeg": "image/jpeg",
  "image/jfif": "image/jpeg",
  "image/pjp": "image/jpeg",
  "image/pipeg": "image/jpeg",
  "image/heic-sequence": "image/heic",
  "image/heif-sequence": "image/heif",
};

const HEIF_FTYP_BRANDS = new Set([
  "heic",
  "heix",
  "heif",
  "heim",
  "heis",
  "mif1",
  "msf1",
]);

export function isImageMimeType(mimeType: string | null | undefined): boolean {
  return Boolean(mimeType?.startsWith("image/"));
}

export function isVideoMimeType(mimeType: string | null | undefined): boolean {
  return Boolean(mimeType?.startsWith("video/"));
}

export function isAudioMimeType(mimeType: string | null | undefined): boolean {
  return Boolean(mimeType?.startsWith("audio/"));
}

export function isMediaMimeType(mimeType: string | null | undefined): boolean {
  return isImageMimeType(mimeType) || isVideoMimeType(mimeType);
}

export function shouldServeAttachmentInline(mimeType: string | null | undefined): boolean {
  return (
    isImageMimeType(mimeType) ||
    isVideoMimeType(mimeType) ||
    isAudioMimeType(mimeType)
  );
}

export function normalizeMimeType(mimeType: string): string {
  const base = mimeType.split(";")[0]?.trim().toLowerCase();
  if (!base) return "application/octet-stream";
  return MIME_ALIASES[base] ?? base;
}

export function isAllowedAvatarMimeType(mimeType: string): boolean {
  return AVATAR_MIME_TYPES.has(normalizeMimeType(mimeType));
}

/** Detect JPEG/PNG/GIF/WebP/HEIC from magic bytes so we don't trust File.type. */
export function sniffImageMimeType(
  data: ArrayBuffer | Uint8Array
): string | null {
  const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
  if (bytes.length < 3) return null;

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    return "image/gif";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  if (bytes.length >= 12) {
    const box = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]);
    if (box === "ftyp") {
      const brands: string[] = [];
      for (let i = 8; i + 4 <= Math.min(bytes.length, 32); i += 4) {
        brands.push(
          String.fromCharCode(
            bytes[i],
            bytes[i + 1],
            bytes[i + 2],
            bytes[i + 3]
          ).toLowerCase()
        );
      }
      if (brands.some((brand) => HEIF_FTYP_BRANDS.has(brand))) {
        return brands.includes("heif") || brands.includes("mif1")
          ? "image/heif"
          : "image/heic";
      }
    }
  }
  if (bytes[0] === 0x42 && bytes[1] === 0x4d) return "image/bmp";
  return null;
}

export function mimeTypeFromFileName(fileName: string): string | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".jfif") || lower.endsWith(".pjpeg") || lower.endsWith(".pjp")) {
    return "image/jpeg";
  }
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".heic")) return "image/heic";
  if (lower.endsWith(".heif")) return "image/heif";
  if (lower.endsWith(".bmp")) return "image/bmp";
  if (lower.endsWith(".mp4") && lower.includes("voice")) return "audio/mp4";
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".webm") && lower.includes("voice")) return "audio/webm";
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".mov")) return "video/quicktime";
  if (lower.endsWith(".m4a")) return "audio/mp4";
  if (lower.endsWith(".mp3")) return "audio/mpeg";
  if (lower.endsWith(".ogg")) return "audio/ogg";
  if (lower.endsWith(".wav")) return "audio/wav";
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".txt")) return "text/plain";
  if (lower.endsWith(".zip")) return "application/zip";
  if (lower.endsWith(".doc")) return "application/msword";
  if (lower.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  return null;
}

export function sanitizeAttachmentFileName(fileName: string): string {
  const base = fileName.split(/[/\\]/).pop()?.trim() ?? "attachment";
  const cleaned = base.replace(/[^\w.\-()+\s]/g, "_").slice(0, 200);
  return cleaned || "attachment";
}

export function inferMimeType(file: File): string {
  const fromFile = normalizeMimeType(file.type?.trim() ?? "");
  if (!GENERIC_MIME_TYPES.has(fromFile)) return fromFile;

  return mimeTypeFromFileName(file.name) ?? "application/octet-stream";
}

export function inferMimeTypeFromBytes(
  fileName: string,
  declaredType: string | null | undefined,
  data: ArrayBuffer | Uint8Array
): string {
  const sniffed = sniffImageMimeType(data);
  if (sniffed) return sniffed;
  const declared = normalizeMimeType(declaredType?.trim() ?? "");
  if (!GENERIC_MIME_TYPES.has(declared)) return declared;
  return mimeTypeFromFileName(fileName) ?? "application/octet-stream";
}

export function validateMessageAttachment(file: File): string | null {
  return validateMessageAttachmentMeta(
    file.name,
    inferMimeType(file),
    file.size
  );
}

export function validateMessageAttachmentMeta(
  fileName: string,
  mimeType: string,
  sizeBytes: number
): string | null {
  if (sizeBytes <= 0) return "File is empty.";
  if (sizeBytes > MESSAGE_ATTACHMENT_MAX_BYTES) {
    return `File must be at most ${formatMaxAttachmentSize()}.`;
  }

  if (!fileName.trim()) return "File name is required.";
  return null;
}

function formatMaxAttachmentSize(): string {
  const bytes = MESSAGE_ATTACHMENT_MAX_BYTES;
  if (bytes >= 1024 * 1024 * 1024) {
    return `${Math.round(bytes / (1024 * 1024 * 1024))} GB`;
  }
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function shouldUseChunkedUpload(sizeBytes: number): boolean {
  return sizeBytes > DIRECT_UPLOAD_MAX_BYTES;
}

export function contentDispositionForAttachment(
  fileName: string,
  inline: boolean
): string {
  const safe = fileName.replace(/[^\w.\-()+ ]/g, "_") || "download";
  const encoded = encodeURIComponent(fileName);
  const type = inline ? "inline" : "attachment";
  return `${type}; filename="${safe}"; filename*=UTF-8''${encoded}`;
}

export function validateAvatarMeta(
  sizeBytes: number,
  mimeType: string
): string | null {
  if (sizeBytes <= 0) return "Image is empty.";
  if (sizeBytes > AVATAR_MAX_BYTES) {
    return `Profile picture must be at most ${AVATAR_MAX_BYTES / (1024 * 1024)} MB.`;
  }
  if (!isAllowedAvatarMimeType(mimeType)) {
    return "Use a JPEG, PNG, WebP, or GIF image.";
  }
  return null;
}

export function validateAvatarFile(file: File): string | null {
  return validateAvatarMeta(file.size, inferMimeType(file));
}

export function formatMessagePreview(body: string, mimeType: string | null, fileName: string | null): string {
  const trimmedBody = body.trim();
  if (trimmedBody) return trimmedBody;
  if (isAudioMimeType(mimeType)) return "Voice message";
  if (isVideoMimeType(mimeType)) return "Video";
  if (isImageMimeType(mimeType)) return "Photo";
  if (fileName) return fileName;
  return "Attachment";
}
