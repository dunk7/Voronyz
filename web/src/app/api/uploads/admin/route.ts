import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isOrdersAdminAuthenticated,
  isOrdersAdminConfigured,
  unauthorizedOrdersResponse,
} from "@/lib/ordersAdmin";

export async function GET(request: NextRequest) {
  if (!isOrdersAdminConfigured()) {
    return NextResponse.json(
      { error: "Admin is not configured on the server." },
      { status: 503 }
    );
  }

  if (!isOrdersAdminAuthenticated(request)) {
    return unauthorizedOrdersResponse();
  }

  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  const submissions = await prisma.stlSubmission.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      name: true,
      email: true,
      customizationRequest: true,
      originalFileName: true,
      storageKey: true,
      sizeBytes: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    submissions: submissions.map((s) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
      sizeMb: Math.round((s.sizeBytes / (1024 * 1024)) * 100) / 100,
    })),
  });
}
