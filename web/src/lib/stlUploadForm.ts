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
import {
  normalizeCustomizationRequest,
  normalizeUploadEmail,
  normalizeUploadName,
} from "@/lib/stlUploadValidation";

export type UploadFieldsInput = {
  honeypot: string;
  formStartedAt: number | null;
  turnstileToken: string;
  nameRaw: string;
  emailRaw: string;
  customizationRaw: string;
};

export type ValidatedUploadFields = {
  name: string;
  email: string | null;
  customizationRequest: string | null;
  clientIp: string;
  ipHash: string;
};

export type UploadFieldError = {
  error: string;
  status: number;
  silentReject?: boolean;
};

export async function validateUploadFields(
  input: UploadFieldsInput,
  request: NextRequest
): Promise<ValidatedUploadFields | UploadFieldError> {
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

  const turnstile = await verifyTurnstileIfConfigured(input.turnstileToken, clientIp);
  if (!turnstile.ok) {
    return turnstile.silentReject
      ? { error: "", status: 200, silentReject: true }
      : { error: turnstile.message, status: 400 };
  }

  const name = normalizeUploadName(input.nameRaw);
  if (!name) {
    return { error: "Please enter your name (2–120 characters).", status: 400 };
  }

  const emailRaw = input.emailRaw.trim();
  const email = emailRaw ? normalizeUploadEmail(input.emailRaw) : null;
  if (emailRaw && !email) {
    return { error: "Please enter a valid email address.", status: 400 };
  }

  const customizationRaw = input.customizationRaw.trim();
  const customizationRequest = customizationRaw
    ? normalizeCustomizationRequest(input.customizationRaw)
    : null;
  if (customizationRaw && !customizationRequest) {
    return {
      error: "Customization notes must be 4,000 characters or fewer.",
      status: 400,
    };
  }

  return { name, email, customizationRequest, clientIp, ipHash };
}

export async function checkUploadRateLimit(ipHash: string): Promise<UploadFieldError | null> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [hourCount, dayCount] = await Promise.all([
    prisma.stlSubmission.count({
      where: { ipHash, createdAt: { gte: oneHourAgo } },
    }),
    prisma.stlSubmission.count({
      where: { ipHash, createdAt: { gte: oneDayAgo } },
    }),
  ]);

  if (hourCount >= MAX_PER_HOUR || dayCount >= MAX_PER_DAY) {
    return {
      error: "Too many uploads from your connection. Please try again later.",
      status: 429,
    };
  }

  return null;
}
