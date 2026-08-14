import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  checkUploadSpam,
  getClientIp,
  hashClientIp,
  MAX_PER_DAY,
  MAX_PER_HOUR,
  verifyTurnstileIfConfigured,
} from "@/lib/uploadAntiSpam";
import { ensureGallerySubmissionTable } from "@/lib/ensureGallerySubmissionTable";

export type GalleryUploadFieldsInput = {
  honeypot: string;
  formStartedAt: number | null;
  turnstileToken: string;
};

export type ValidatedGalleryUploadFields = {
  clientIp: string;
  ipHash: string;
};

export type GalleryUploadFieldError = {
  error: string;
  status: number;
  silentReject?: boolean;
};

export async function validateGalleryUploadFields(
  input: GalleryUploadFieldsInput,
  request: NextRequest
): Promise<ValidatedGalleryUploadFields | GalleryUploadFieldError> {
  const clientIp = getClientIp(request);
  const ipHash = hashClientIp(clientIp);

  const spam = checkUploadSpam({
    honeypot: input.honeypot,
    formStartedAt: input.formStartedAt,
    turnstileToken: input.turnstileToken,
  });
  if (!spam.ok) {
    return spam.silentReject
      ? { error: "", status: 200, silentReject: true }
      : { error: spam.message, status: 400 };
  }

  const turnstile = await verifyTurnstileIfConfigured(
    input.turnstileToken,
    clientIp
  );
  if (!turnstile.ok) {
    return turnstile.silentReject
      ? { error: "", status: 200, silentReject: true }
      : { error: turnstile.message, status: 400 };
  }

  return { clientIp, ipHash };
}

export async function checkGalleryUploadRateLimit(
  ipHash: string
): Promise<{ error: string; status: number } | null> {
  await ensureGallerySubmissionTable();

  const now = Date.now();
  const hourAgo = new Date(now - 60 * 60 * 1000);
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000);

  const [hourCount, dayCount] = await Promise.all([
    prisma.gallerySubmission.count({
      where: { ipHash, createdAt: { gte: hourAgo } },
    }),
    prisma.gallerySubmission.count({
      where: { ipHash, createdAt: { gte: dayAgo } },
    }),
  ]);

  if (hourCount >= MAX_PER_HOUR || dayCount >= MAX_PER_DAY) {
    return {
      error: "Too many uploads from this network. Please try again later.",
      status: 429,
    };
  }

  return null;
}
