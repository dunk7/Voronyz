export const UPLOAD_MAX_BYTES = 50 * 1024 * 1024; // 50 MB

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeUploadName(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 120) return null;
  return name;
}

export function normalizeUploadEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (!email) return null;
  if (email.length > 254 || !EMAIL_RE.test(email)) return null;
  return email;
}

export function normalizeCustomizationRequest(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;
  if (text.length > 4000) return null;
  return text;
}

export function sanitizeUploadFileName(raw: string): string {
  const base = raw.trim().split(/[/\\]/).pop() ?? "upload";
  const cleaned = base.replace(/[^\w.\-()+ ]/g, "_").slice(0, 180);
  return cleaned || "upload";
}
