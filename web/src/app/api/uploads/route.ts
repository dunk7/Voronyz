import { NextRequest, NextResponse } from "next/server";
import { validateUploadFields, checkUploadRateLimit } from "@/lib/stlUploadForm";
import { notifyPersistedUpload, persistStlUpload } from "@/lib/stlUploadPersist";
import { UPLOAD_MAX_BYTES } from "@/lib/stlUploadValidation";

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

    const fields = await validateUploadFields(
      {
        honeypot: String(formData.get("company") ?? ""),
        formStartedAt: Number(formData.get("_formStartedAt")),
        turnstileToken: String(formData.get("cf-turnstile-response") ?? ""),
        nameRaw: String(formData.get("name") ?? ""),
        emailRaw: String(formData.get("email") ?? ""),
        customizationRaw: String(formData.get("customizationRequest") ?? ""),
      },
      request
    );

    if ("error" in fields) {
      if (fields.silentReject) return fakeSuccess();
      return NextResponse.json({ error: fields.error }, { status: fields.status });
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

    const rateLimit = await checkUploadRateLimit(fields.ipHash);
    if (rateLimit) {
      return NextResponse.json({ error: rateLimit.error }, { status: rateLimit.status });
    }

    const buffer = Buffer.from(await fileField.arrayBuffer());
    const row = await persistStlUpload({
      name: fields.name,
      email: fields.email,
      customizationRequest: fields.customizationRequest,
      originalFileName: fileField.name,
      buffer,
      ipHash: fields.ipHash,
    });

    notifyPersistedUpload(row);

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
