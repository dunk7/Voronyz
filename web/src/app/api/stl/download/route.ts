import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { orderIncludesStlDownload, stlShoeById, stlShoeByName } from "@/lib/stlFiles";
import { getStlZipPath } from "@/lib/stlPurchaseDownload";

export const runtime = "nodejs";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-08-27.basil",
    })
  : null;

function checkoutAllowsDownload(session: Stripe.Checkout.Session): boolean {
  if (session.payment_status === "paid") return true;
  const paymentIntent =
    typeof session.payment_intent === "object" && session.payment_intent
      ? session.payment_intent
      : null;
  const isAch =
    session.metadata?.paymentMethod === "ach" ||
    paymentIntent?.status === "processing";
  return (
    isAch &&
    session.status === "complete" &&
    (paymentIntent?.status === "processing" || session.payment_status === "unpaid")
  );
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id")?.trim();
  if (!sessionId) {
    return NextResponse.json({ error: "Session ID required" }, { status: 400 });
  }
  if (!stripe) {
    return NextResponse.json(
      { error: "Payment processing is not configured." },
      { status: 503 }
    );
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items", "payment_intent"],
  });

  if (!checkoutAllowsDownload(session)) {
    return NextResponse.json({ error: "Payment is not complete yet." }, { status: 402 });
  }

  let cartItems: Array<{
    productSlug?: string;
    productName?: string;
    name?: string;
    variantName?: string;
    color?: string;
  }> = [];
  try {
    if (session.metadata?.cartItems) {
      cartItems = JSON.parse(session.metadata.cartItems);
    }
  } catch {
    cartItems = [];
  }

  const stripeLines = (session.line_items?.data || []).map((item) => ({
    name: item.description || "",
  }));
  const purchased = cartItems.length > 0 ? cartItems : stripeLines;

  if (!orderIncludesStlDownload(purchased)) {
    return NextResponse.json(
      { error: "This order does not include a Voronyz STL." },
      { status: 403 }
    );
  }

  const requested = request.nextUrl.searchParams.get("shoe")?.trim();
  const fromOrder = purchased
    .map((line) => {
      const color = "color" in line ? line.color : undefined;
      const variantName = "variantName" in line ? line.variantName : undefined;
      return stlShoeById(color) ?? stlShoeByName(variantName) ?? stlShoeByName(line.name);
    })
    .find((shoe) => shoe?.file);
  const shoe = stlShoeById(requested) ?? stlShoeByName(requested) ?? fromOrder;
  const zip = shoe ? getStlZipPath(shoe.id) : null;
  if (!zip) {
    return NextResponse.json(
      { error: "That shoe's STL file is not available yet." },
      { status: 404 }
    );
  }

  const body = fs.readFileSync(zip.filePath);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Length": String(body.byteLength),
      "Content-Disposition": `attachment; filename="${zip.fileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
