import { NextRequest, NextResponse } from "next/server";
import {
  checkGalleryUploadRateLimit,
  validateGalleryUploadFields,
} from "@/lib/galleryUploadForm";
import {
  GALLERY_UPLOAD_MAX_BYTES,
  notifyPersistedGalleryUpload,
  persistGalleryUpload,
} from "@/lib/gallerySubmission";
import { ensureGallerySubmissionTable } from "@/lib/ensureGallerySubmissionTable";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fakeSuccess() {
  return NextResponse.json({
    success: true,
    id: "received",
    message:
      "Thanks! Your review photo was received and will appear after we approve it.",
  });
}

function resolveMimeType(file: File): string {
  if (file.type.startsWith("image/")) return file.type;
  const lower = (file.name || "").toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL?.trim()) {
      return NextResponse.json(
        { error: "Photo uploads are temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

    try {
      await ensureGallerySubmissionTable();
    } catch (schemaErr) {
      console.error("Gallery schema ensure failed:", schemaErr);
      return NextResponse.json(
        { error: "Photo uploads are not fully set up yet. Please try again shortly." },
        { status: 503 }
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form submission." }, { status: 400 });
    }

    const fields = await validateGalleryUploadFields(
      {
        honeypot: String(formData.get("company") ?? ""),
        formStartedAt: Number(formData.get("_formStartedAt")),
        turnstileToken: String(formData.get("cf-turnstile-response") ?? ""),
        nameRaw: String(formData.get("name") ?? ""),
        emailRaw: String(formData.get("email") ?? ""),
        captionRaw: String(formData.get("caption") ?? ""),
      },
      request
    );

    if ("error" in fields) {
      if (fields.silentReject) return fakeSuccess();
      return NextResponse.json({ error: fields.error }, { status: fields.status });
    }

    const fileField = formData.get("file");
    if (!(fileField instanceof File)) {
      return NextResponse.json({ error: "Please choose a photo to upload." }, { status: 400 });
    }

    const isImage =
      fileField.type.startsWith("image/") ||
      /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(fileField.name || "");
    if (!isImage) {
      return NextResponse.json(
        { error: "File must be an image (JPEG, PNG, WebP, or HEIC)." },
        { status: 400 }
      );
    }

    if (fileField.size <= 0 || fileField.size > GALLERY_UPLOAD_MAX_BYTES) {
      return NextResponse.json(
        {
          error: `Photo must be between 1 byte and ${GALLERY_UPLOAD_MAX_BYTES / (1024 * 1024)} MB.`,
        },
        { status: 400 }
      );
    }

    const rateLimit = await checkGalleryUploadRateLimit(fields.ipHash);
    if (rateLimit) {
      return NextResponse.json({ error: rateLimit.error }, { status: rateLimit.status });
    }

    const buffer = Buffer.from(await fileField.arrayBuffer());
    const row = await persistGalleryUpload({
      name: fields.name,
      email: fields.email,
      caption: fields.caption,
      originalFileName: fileField.name,
      mimeType: resolveMimeType(fileField),
      buffer,
      ipHash: fields.ipHash,
    });

    notifyPersistedGalleryUpload(row);

    return NextResponse.json({
      success: true,
      id: row.id,
      message:
        "Thanks! Your review photo was submitted and is waiting for approval before it appears in the gallery.",
    });
  } catch (err) {
    console.error("Gallery photo submission failed:", err);

    const message =
      err instanceof Error &&
      (err.message.includes("GallerySubmission") ||
        err.message.includes("does not exist") ||
        err.message.includes("fileData"))
        ? "Photo uploads are not fully set up yet. Please try again shortly."
        : "Something went wrong saving your photo. Please try again.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
