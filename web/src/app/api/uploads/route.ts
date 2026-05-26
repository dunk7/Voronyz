import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  checkUploadSpam,
  getClientIp,
  hashClientIp,
  MAX_PER_DAY,
  MAX_PER_HOUR,
  verifyTurnstileIfConfigured,
} from "@/lib/uploadAntiSpam";
import { buildStlStorageKey, storeStlFile } from "@/lib/stlUploadStorage";
import {
  normalizeCustomizationRequest,
  normalizeUploadEmail,
  normalizeUploadName,
  sanitizeUploadFileName,
  UPLOAD_MAX_BYTES,
} from "@/lib/stlUploadValidation";

export const runtime = "nodejs";

function fakeSuccess() {
  return NextResponse.json({
    success: true,
    id: "received",
    message: "Thanks! We received your file and will be in touch if needed.",
  });
}

export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json(
      { error: "Uploads are temporarily unavailable. Please try again later." },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form submission." }, { status: 400 });
  }

  const clientIp = getClientIp(request);
  const ipHash = hashClientIp(clientIp);

  const spam = checkUploadSpam({
    honeypot: String(formData.get("company") ?? ""),
    formStartedAt: Number(formData.get("_formStartedAt")),
    turnstileToken: String(formData.get("cf-turnstile-response") ?? ""),
  });

  if (!spam.ok) {
    if (spam.silentReject) return fakeSuccess();
    return NextResponse.json({ error: spam.message }, { status: 400 });
  }

  const turnstile = await verifyTurnstileIfConfigured(
    String(formData.get("cf-turnstile-response") ?? ""),
    clientIp
  );
  if (!turnstile.ok) {
    if (turnstile.silentReject) return fakeSuccess();
    return NextResponse.json({ error: turnstile.message }, { status: 400 });
  }

  const name = normalizeUploadName(String(formData.get("name") ?? ""));
  if (!name) {
    return NextResponse.json({ error: "Please enter your name (2–120 characters)." }, { status: 400 });
  }

  const emailRaw = String(formData.get("email") ?? "");
  const email = emailRaw.trim() ? normalizeUploadEmail(emailRaw) : null;
  if (emailRaw.trim() && !email) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const customizationRaw = String(formData.get("customizationRequest") ?? "");
  const customizationRequest = customizationRaw.trim()
    ? normalizeCustomizationRequest(customizationRaw)
    : null;
  if (customizationRaw.trim() && !customizationRequest) {
    return NextResponse.json(
      { error: "Customization notes must be 4,000 characters or fewer." },
      { status: 400 }
    );
  }

  const fileField = formData.get("file");
  if (!(fileField instanceof File)) {
    return NextResponse.json({ error: "Please attach a file." }, { status: 400 });
  }

  if (fileField.size <= 0 || fileField.size > UPLOAD_MAX_BYTES) {
    return NextResponse.json(
      { error: `File must be between 1 byte and ${UPLOAD_MAX_BYTES / (1024 * 1024)} MB.` },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await fileField.arrayBuffer());
  const contentType =
    fileField.type?.trim() || "application/octet-stream";

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
    return NextResponse.json(
      { error: "Too many uploads from your connection. Please try again later." },
      { status: 429 }
    );
  }

  const originalFileName = sanitizeUploadFileName(fileField.name);
  const submissionId = randomUUID();
  const storageKey = buildStlStorageKey(submissionId, originalFileName);

  try {
    await storeStlFile(storageKey, buffer, contentType);
  } catch (err) {
    console.error("STL storage failed:", err);
    return NextResponse.json(
      { error: "We could not save your file. Please try again in a few minutes." },
      { status: 500 }
    );
  }

  try {
    const row = await prisma.stlSubmission.create({
      data: {
        id: submissionId,
        name,
        email,
        customizationRequest,
        originalFileName,
        storageKey,
        sizeBytes: buffer.length,
        ipHash,
      },
    });

    return NextResponse.json({
      success: true,
      id: row.id,
      message: "Thanks! We received your file and will review it soon.",
    });
  } catch (err) {
    console.error("STL submission DB insert failed:", err);
    return NextResponse.json(
      { error: "We saved your file but could not finish registration. Please contact us." },
      { status: 500 }
    );
  }
}
