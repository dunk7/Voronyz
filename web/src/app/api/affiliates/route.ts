import { NextRequest, NextResponse } from "next/server";
import {
  countRecentAffiliateApplications,
  hashAffiliateIp,
  saveAffiliateApplication,
  validateAffiliateApplicationBody,
} from "@/lib/affiliateApplication";
import { notifyAffiliateApplication } from "@/lib/adminNotifyEmail";
import {
  checkUploadSpam,
  getClientIp,
  verifyTurnstileIfConfigured,
} from "@/lib/uploadAntiSpam";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fakeSuccess() {
  return NextResponse.json({
    success: true,
    id: "received",
    message:
      "Thanks — we received your affiliate application and will review it soon.",
  });
}

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid form submission." }, { status: 400 });
    }

    const spam = checkUploadSpam({
      honeypot: String(body.company ?? body.website ?? ""),
      formStartedAt:
        typeof body._formStartedAt === "number"
          ? body._formStartedAt
          : Number(body._formStartedAt),
      turnstileToken: String(body.turnstileToken ?? body["cf-turnstile-response"] ?? ""),
    });
    if (!spam.ok) {
      if (spam.silentReject) return fakeSuccess();
      return NextResponse.json({ error: spam.message }, { status: 400 });
    }

    const clientIp = getClientIp(request);
    const turnstile = await verifyTurnstileIfConfigured(
      String(body.turnstileToken ?? body["cf-turnstile-response"] ?? ""),
      clientIp
    );
    if (!turnstile.ok) {
      if (turnstile.silentReject) return fakeSuccess();
      return NextResponse.json({ error: turnstile.message }, { status: 400 });
    }

    const validated = validateAffiliateApplicationBody(body);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    if (!process.env.DATABASE_URL?.trim()) {
      // Still notify by email if possible so applications are not lost.
      const stub = {
        id: "email-only",
        firstName: validated.data.firstName,
        lastName: validated.data.lastName,
        email: validated.data.email,
        phone: validated.data.phone ?? null,
        platform: validated.data.platform,
        handleOrUrl: validated.data.handleOrUrl,
        audienceSize: validated.data.audienceSize,
        preferredSlug: validated.data.preferredSlug ?? null,
        preferredCode: validated.data.preferredCode ?? null,
        niche: validated.data.niche,
        pitch: validated.data.pitch,
        status: "pending",
        ipHash: null,
        createdAt: new Date(),
      };
      notifyAffiliateApplication(stub);
      return NextResponse.json({
        success: true,
        id: "received",
        message:
          "Thanks — we received your affiliate application and will review it soon.",
      });
    }

    const ipHash = hashAffiliateIp(clientIp);
    if (ipHash) {
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recent = await countRecentAffiliateApplications(ipHash, hourAgo);
      if (recent >= 5) {
        return NextResponse.json(
          { error: "Too many applications from this network. Please try again later." },
          { status: 429 }
        );
      }
    }

    const row = await saveAffiliateApplication({
      ...validated.data,
      ipHash,
    });

    notifyAffiliateApplication(row);

    return NextResponse.json({
      success: true,
      id: row.id,
      message:
        "Thanks — we received your affiliate application and will review it soon.",
    });
  } catch (err) {
    console.error("Affiliate application failed:", err);
    return NextResponse.json(
      {
        error:
          "Something went wrong saving your application. Please try again or email us.",
      },
      { status: 500 }
    );
  }
}
