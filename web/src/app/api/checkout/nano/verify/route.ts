import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const NANO_RPC_URL = process.env.NANO_RPC_URL || "https://rpc.nano.to/";
const NANO_RECEIVE_ADDRESS = process.env.NANO_RECEIVE_ADDRESS;

// 0.0001 XNO tolerance in raw (handles minor rounding differences)
const AMOUNT_TOLERANCE = BigInt("100000000000000000000000000"); // 0.0001 × 10^30

interface NanoBlockInfo {
  amount?: string;
  source?: string;
}

interface HistoryEntry {
  type: string;
  account: string;
  amount: string;
  local_timestamp: string;
  height: string;
  hash: string;
}

/** Helper: does `blockAmount` match `expectedAmount` within tolerance? */
function amountMatches(blockAmount: bigint, expectedAmount: bigint): boolean {
  const diff =
    blockAmount > expectedAmount
      ? blockAmount - expectedAmount
      : expectedAmount - blockAmount;
  return diff <= AMOUNT_TOLERANCE;
}

/** Build the standard pending-response payload. */
function pendingPayload(
  orderId: string,
  metadata: Record<string, unknown> | null
) {
  return {
    status: "pending" as const,
    orderId,
    nanoAddress: NANO_RECEIVE_ADDRESS,
    xnoAmount: metadata?.xnoAmount,
    xnoRaw: metadata?.xnoRaw,
    usdTotal: metadata?.usdTotal,
    xnoPrice: metadata?.xnoPrice,
    expiresAt: metadata?.expiresAt,
    lineItems: metadata?.lineItems,
    customer: metadata?.customer,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const metadata = order.metadata as Record<string, unknown> | null;

    // Already paid — return immediately with stored details
    if (order.status === "paid") {
      return NextResponse.json({
        status: "paid",
        orderId: order.id,
        nanoAddress: metadata?.nanoAddress,
        xnoAmount: metadata?.xnoAmount,
        xnoRaw: metadata?.xnoRaw,
        usdTotal: metadata?.usdTotal,
        xnoPrice: metadata?.xnoPrice,
        expiresAt: metadata?.expiresAt,
        lineItems: metadata?.lineItems,
        customer: metadata?.customer,
        blockHash: (metadata as Record<string, unknown>)?.nanoBlockHash,
      });
    }

    if (order.status !== "pending_nano") {
      return NextResponse.json(
        { error: "Invalid order status" },
        { status: 400 }
      );
    }

    const expectedRaw = metadata?.xnoRaw as string | undefined;

    if (!expectedRaw || !NANO_RECEIVE_ADDRESS) {
      return NextResponse.json(
        { error: "Payment configuration error" },
        { status: 500 }
      );
    }

    // Check session expiry
    const expiresAt = metadata?.expiresAt as string | undefined;
    if (expiresAt && new Date(expiresAt) < new Date()) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "expired" },
      });
      return NextResponse.json({
        status: "expired",
        error: "Payment session has expired",
      });
    }

    const expectedAmount = BigInt(expectedRaw);
    // Unix timestamp when the order was created — only consider blocks after this
    const orderCreatedAt = metadata?.createdAt
      ? Math.floor(new Date(metadata.createdAt as string).getTime() / 1000)
      : 0;

    /* ================================================================
     *  1. Check `receivable` — blocks sent TO the account but not yet
     *     pocketed (e.g. if the wallet is offline or not auto-receiving).
     * ================================================================ */
    try {
      const rpcRes = await fetch(NANO_RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "receivable",
          account: NANO_RECEIVE_ADDRESS,
          count: "100",
          source: "true",
          threshold: "1000000000000000000000000000", // 0.001 XNO min
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (rpcRes.ok) {
        const rpcData = await rpcRes.json();
        let blocks: Record<string, NanoBlockInfo | string> | null =
          rpcData?.blocks ?? null;
        if (typeof blocks === "string") blocks = null;

        if (blocks && typeof blocks === "object") {
          for (const [blockHash, blockData] of Object.entries(blocks)) {
            const rawAmount =
              typeof blockData === "object" && blockData !== null
                ? blockData.amount
                : typeof blockData === "string"
                ? blockData
                : undefined;
            if (!rawAmount) continue;

            if (amountMatches(BigInt(rawAmount), expectedAmount)) {
              const sender =
                typeof blockData === "object" && blockData !== null
                  ? blockData.source
                  : undefined;

              return await markPaid(orderId, metadata, blockHash, sender);
            }
          }
        }
      }
    } catch (rpcErr) {
      console.error("Nano RPC receivable check failed:", rpcErr);
    }

    /* ================================================================
     *  2. Check `account_history` — blocks already received/pocketed.
     *     This catches payments that were auto-received by the wallet
     *     (e.g. Natrium, Nault, sending to yourself, etc.).
     * ================================================================ */
    try {
      const histRes = await fetch(NANO_RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "account_history",
          account: NANO_RECEIVE_ADDRESS,
          count: "50",
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (histRes.ok) {
        const histData = await histRes.json();
        const history: HistoryEntry[] = histData?.history ?? [];

        for (const entry of history) {
          // Only look at receive blocks
          if (entry.type !== "receive") continue;

          // Only consider blocks created after the order was placed
          const blockTimestamp = parseInt(entry.local_timestamp, 10) || 0;
          if (orderCreatedAt > 0 && blockTimestamp < orderCreatedAt) continue;

          if (amountMatches(BigInt(entry.amount), expectedAmount)) {
            return await markPaid(
              orderId,
              metadata,
              entry.hash,
              entry.account
            );
          }
        }
      }
    } catch (histErr) {
      console.error("Nano RPC account_history check failed:", histErr);
    }

    // No matching block found in either check
    return NextResponse.json(pendingPayload(order.id, metadata));
  } catch (error) {
    console.error("Nano verify error:", error);
    return NextResponse.json(
      { status: "error", error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}

/* ------------------------------------------------------------------ */
/*  Mark an order as paid and return the success response              */
/* ------------------------------------------------------------------ */
async function markPaid(
  orderId: string,
  metadata: Record<string, unknown> | null,
  blockHash: string,
  sender?: string
) {
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "paid",
      metadata: {
        ...((metadata as object) ?? {}),
        paymentStatus: "paid",
        nanoBlockHash: blockHash,
        nanoSender: sender ?? null,
        confirmedAt: new Date().toISOString(),
      },
    },
  });

  console.log(`Nano payment confirmed for order ${orderId}: block ${blockHash}`);

  return NextResponse.json({
    status: "paid",
    orderId,
    blockHash,
    nanoAddress: NANO_RECEIVE_ADDRESS,
    xnoAmount: metadata?.xnoAmount,
    xnoRaw: metadata?.xnoRaw,
    usdTotal: metadata?.usdTotal,
    xnoPrice: metadata?.xnoPrice,
    lineItems: metadata?.lineItems,
    customer: metadata?.customer,
  });
}
