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
import { buildStlStorageKey } from "@/lib/stlUploadStorage";
import { writeStlFile, deleteStlFile } from "@/lib/stlBlobStorage";
import { notifyNewUpload } from "@/lib/adminNotifyEmail";
import {
  normalizeCustomizationRequest,
  normalizeUploadEmail,
  normalizeUploadName,
  sanitizeUploadFileName,
  UPLOAD_MAX_BYTES,
} from "@/lib/stlUploadValidation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fakeSuccess() {
  return NextResponse.json({
    success: true,
    id: "received",
    message: "Thanks! We received your file and will be in touch if needed.",
  });
}

export async function POST(request: NextRequest) {
  try {
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

    let storedInBlob = false;
    try {
      await writeStlFile(storageKey, buffer);
      storedInBlob = true;
    } catch (blobErr) {
      console.error("STL blob write failed, falling back to Postgres fileData:", blobErr);
    }

    const baseRow = {
      id: submissionId,
      name,
      email,
      customizationRequest,
      originalFileName,
      storageKey,
      sizeBytes: buffer.length,
      ipHash,
    };

    let row;
    try {
      row = await prisma.stlSubmission.create({
        data: storedInBlob ? baseRow : { ...baseRow, fileData: buffer },
      });
    } catch (createErr) {
      // Schema migration may not have made fileData optional yet — retry with bytes in Postgres.
      if (
        storedInBlob &&
        createErr instanceof Error &&
        (createErr.message.includes("fileData") || createErr.message.includes("null constraint"))
      ) {
        row = await prisma.stlSubmission.create({
          data: { ...baseRow, fileData: buffer },
        });
      } else {
        if (storedInBlob) {
          await deleteStlFile(storageKey).catch(() => undefined);
        }
        throw createErr;
      }
    }

    notifyNewUpload(row);

    return NextResponse.json({
      success: true,
      id: row.id,
      message: "Thanks! We received your file and will review it soon.",
    });
  } catch (err) {
    console.error("Upload submission failed:", err);

    const message =
      err instanceof Error &&
      (err.message.includes("StlSubmission") ||
        err.message.includes("does not exist") ||
        err.message.includes("fileData"))
        ? "Uploads are not fully set up yet. Please try again shortly."
        : "Something went wrong saving your upload. Please try again.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
