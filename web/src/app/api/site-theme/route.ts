import { NextResponse } from "next/server";
import { getSiteDarkMode } from "@/lib/siteTheme";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dark = await getSiteDarkMode();
    return NextResponse.json(
      { dark },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (err) {
    console.error("Failed to read site theme:", err);
    return NextResponse.json(
      { dark: false },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }
}
