import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Mock checkout for demo purposes
    console.log("⚠️  Using mock checkout - no STRIPE_SECRET_KEY provided");

    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({
      url: `http://localhost:3000/checkout/success?session_id=mock-session-${Date.now()}`,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}