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
  return base || "application/octet-stream";
}

export function sanitizeAttachmentFileName(fileName: string): string {
  const base = fileName.split(/[/\\]/).pop()?.trim() ?? "attachment";
  const cleaned = base.replace(/[^\w.\-()+\s]/g, "_").slice(0, 200);
  return cleaned || "attachment";
}

export function inferMimeType(file: File): string {
  const fromFile = file.type?.trim();
  if (fromFile) return normalizeMimeType(fromFile);

  const lower = file.name.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".heic")) return "image/heic";
  if (lower.endsWith(".heif")) return "image/heif";
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
  return "application/octet-stream";
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

export function validateAvatarFile(file: File): string | null {
  if (file.size <= 0) return "Image is empty.";
  if (file.size > AVATAR_MAX_BYTES) {
    return `Profile picture must be at most ${AVATAR_MAX_BYTES / (1024 * 1024)} MB.`;
  }
  const mimeType = normalizeMimeType(inferMimeType(file));
  if (!AVATAR_MIME_TYPES.has(mimeType)) {
    return "Use a JPEG, PNG, WebP, or GIF image.";
  }
  return null;
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
