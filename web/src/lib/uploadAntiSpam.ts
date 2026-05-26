import { createHash } from "crypto";
import { NextRequest } from "next/server";

const MIN_FORM_MS = 3000;
const MAX_PER_HOUR = 30;
const MAX_PER_DAY = 100;

export function getClientIp(request: NextRequest): string {
  const nf = request.headers.get("x-nf-client-connection-ip");
  if (nf) return nf.trim();

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return "unknown";
}

export function hashClientIp(ip: string): string {
  const salt =
    process.env.UPLOAD_IP_SALT?.trim() ||
    process.env.ORDERS_ADMIN_PASSWORD?.trim() ||
    "voronyz-upload-dev-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export type SpamCheckInput = {
  honeypot: string;
  formStartedAt: number | null;
  turnstileToken: string;
};

export type SpamCheckResult =
  | { ok: true; silentReject?: false }
  | { ok: false; silentReject: true }
  | { ok: false; silentReject: false; message: string };

/** Bots that fill hidden fields get a fake success without storing anything. */
export function checkUploadSpam(input: SpamCheckInput): SpamCheckResult {
  if (input.honeypot.trim().length > 0) {
    return { ok: false, silentReject: true };
  }

  if (input.formStartedAt == null || !Number.isFinite(input.formStartedAt)) {
    return { ok: false, silentReject: false, message: "Please wait a moment and try again." };
  }

  const elapsed = Date.now() - input.formStartedAt;
  if (elapsed < MIN_FORM_MS) {
    return { ok: false, silentReject: false, message: "Please wait a moment and try again." };
  }

  if (elapsed > 24 * 60 * 60 * 1000) {
    return { ok: false, silentReject: false, message: "This form expired. Please refresh and try again." };
  }

  return { ok: true };
}

export async function verifyTurnstileIfConfigured(
  token: string,
  remoteIp: string
): Promise<SpamCheckResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return { ok: true };

  if (!token.trim()) {
    return { ok: false, silentReject: false, message: "Please complete the security check." };
  }

  const body = new URLSearchParams({
    secret,
    response: token,
    remoteip: remoteIp,
  });

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    return { ok: false, silentReject: false, message: "Security verification failed. Try again." };
  }

  const data = (await res.json()) as { success?: boolean };
  if (!data.success) {
    return { ok: false, silentReject: false, message: "Security verification failed. Try again." };
  }

  return { ok: true };
}

export { MAX_PER_DAY, MAX_PER_HOUR };
