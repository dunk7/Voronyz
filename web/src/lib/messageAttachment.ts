export const MESSAGE_ATTACHMENT_MAX_BYTES = 15 * 1024 * 1024;
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "application/pdf",
  "text/plain",
  "application/zip",
  "application/x-zip-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

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

export function isMediaMimeType(mimeType: string | null | undefined): boolean {
  return isImageMimeType(mimeType) || isVideoMimeType(mimeType);
}

export function sanitizeAttachmentFileName(fileName: string): string {
  const base = fileName.split(/[/\\]/).pop()?.trim() ?? "attachment";
  const cleaned = base.replace(/[^\w.\-()+\s]/g, "_").slice(0, 200);
  return cleaned || "attachment";
}

export function inferMimeType(file: File): string {
  const fromFile = file.type?.trim().toLowerCase();
  if (fromFile) return fromFile;

  const lower = file.name.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".mov")) return "video/quicktime";
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
  if (file.size <= 0) return "File is empty.";
  if (file.size > MESSAGE_ATTACHMENT_MAX_BYTES) {
    return `File must be at most ${MESSAGE_ATTACHMENT_MAX_BYTES / (1024 * 1024)} MB.`;
  }

  const mimeType = inferMimeType(file);
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return "That file type is not supported. Try an image, video, PDF, or common document.";
  }

  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  const mimeType = inferMimeType(file);
  if (!AVATAR_MIME_TYPES.has(mimeType)) {
    return "Use a JPEG, PNG, WebP, or GIF image.";
  }
  return null;
}

export function formatMessagePreview(body: string, mimeType: string | null, fileName: string | null): string {
  const trimmedBody = body.trim();
  if (trimmedBody) return trimmedBody;
  if (isVideoMimeType(mimeType)) return "Video";
  if (isImageMimeType(mimeType)) return "Photo";
  if (fileName) return fileName;
  return "Attachment";
}
