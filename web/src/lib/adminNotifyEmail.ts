import type {
  AffiliateApplication,
  GallerySubmission,
  Order,
  StlSubmission,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  formatShippingAddress,
  isRecord,
  parseOrderMetadata,
} from "@/lib/orderTypes";

const DEFAULT_ADMIN_EMAIL = "voronyz@gmail.com";

function adminRecipient(): string {
  return (process.env.ADMIN_NOTIFY_EMAIL ?? DEFAULT_ADMIN_EMAIL).trim();
}

function siteBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://voronyz.com"
  );
}

function fromAddress(): string {
  return (
    process.env.NOTIFY_FROM_EMAIL?.trim() ||
    "Voronyz <notifications@voronyz.com>"
  );
}

function formatUsd(cents: number, currency: string): string {
  if (currency.toLowerCase() === "xno") {
    return `${(cents / 100).toFixed(2)} USD equiv.`;
  }
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

async function sendAdminEmail(subject: string, text: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.warn("Admin notify: RESEND_API_KEY not set — skipping email.");
    return false;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: [adminRecipient()],
      subject,
      text,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("Admin notify: Resend failed", res.status, body);
    return false;
  }

  return true;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Fire-and-forget; never throws to callers. */
export function notifyNewUpload(submission: StlSubmission): void {
  void notifyNewUploadAsync(submission).catch((err) => {
    console.error("Admin notify upload failed:", err);
  });
}

async function notifyNewUploadAsync(submission: StlSubmission): Promise<void> {
  const adminUrl = `${siteBaseUrl()}/orders`;
  const sizeMb = (submission.sizeBytes / (1024 * 1024)).toFixed(2);

  const lines = [
    `New file upload on voronyz.com/upload`,
    ``,
    `Name: ${submission.name}`,
    submission.email ? `Email: ${submission.email}` : null,
    `File: ${submission.originalFileName} (${sizeMb} MB)`,
    submission.customizationRequest
      ? `Notes: ${submission.customizationRequest}`
      : null,
    `Submission ID: ${submission.id}`,
    ``,
    `View in admin: ${adminUrl}`,
  ].filter(Boolean) as string[];

  const subject = `New upload: ${submission.name} — ${submission.originalFileName}`;
  const text = lines.join("\n");
  const html = [
    `<p><strong>New file upload</strong> on <a href="${escapeHtml(siteBaseUrl())}/upload">voronyz.com/upload</a></p>`,
    `<ul>`,
    `<li><strong>Name:</strong> ${escapeHtml(submission.name)}</li>`,
    submission.email
      ? `<li><strong>Email:</strong> ${escapeHtml(submission.email)}</li>`
      : "",
    `<li><strong>File:</strong> ${escapeHtml(submission.originalFileName)} (${sizeMb} MB)</li>`,
    submission.customizationRequest
      ? `<li><strong>Notes:</strong> ${escapeHtml(submission.customizationRequest)}</li>`
      : "",
    `<li><strong>ID:</strong> ${escapeHtml(submission.id)}</li>`,
    `</ul>`,
    `<p><a href="${escapeHtml(adminUrl)}">Open orders &amp; uploads admin</a></p>`,
  ]
    .filter(Boolean)
    .join("");

  await sendAdminEmail(subject, text, html);
}

/** Fire-and-forget affiliate application email. */
export function notifyAffiliateApplication(application: AffiliateApplication): void {
  void notifyAffiliateApplicationAsync(application).catch((err) => {
    console.error("Admin notify affiliate failed:", err);
  });
}

async function notifyAffiliateApplicationAsync(
  application: AffiliateApplication
): Promise<void> {
  const adminUrl = `${siteBaseUrl()}/orders`;
  const name = `${application.firstName} ${application.lastName}`.trim();

  const lines = [
    `New affiliate application on voronyz.com/affiliates`,
    ``,
    `Name: ${name}`,
    `Email: ${application.email}`,
    application.phone ? `Phone: ${application.phone}` : null,
    `Platform: ${application.platform}`,
    `Handle / URL: ${application.handleOrUrl}`,
    `Audience: ${application.audienceSize}`,
    application.preferredSlug
      ? `Preferred short link: voronyz.com/${application.preferredSlug}`
      : null,
    application.preferredCode
      ? `Preferred code: ${application.preferredCode}`
      : null,
    ``,
    `Niche:`,
    application.niche,
    ``,
    `Pitch:`,
    application.pitch,
    ``,
    `Application ID: ${application.id}`,
    `View in admin: ${adminUrl}`,
  ].filter(Boolean) as string[];

  const subject = `Affiliate application: ${name} (${application.platform})`;
  const text = lines.join("\n");
  const html = [
    `<p><strong>New affiliate application</strong> on <a href="${escapeHtml(siteBaseUrl())}/affiliates">voronyz.com/affiliates</a></p>`,
    `<ul>`,
    `<li><strong>Name:</strong> ${escapeHtml(name)}</li>`,
    `<li><strong>Email:</strong> <a href="mailto:${escapeHtml(application.email)}">${escapeHtml(application.email)}</a></li>`,
    application.phone
      ? `<li><strong>Phone:</strong> ${escapeHtml(application.phone)}</li>`
      : "",
    `<li><strong>Platform:</strong> ${escapeHtml(application.platform)}</li>`,
    `<li><strong>Handle / URL:</strong> ${escapeHtml(application.handleOrUrl)}</li>`,
    `<li><strong>Audience:</strong> ${escapeHtml(application.audienceSize)}</li>`,
    application.preferredSlug
      ? `<li><strong>Preferred short link:</strong> voronyz.com/${escapeHtml(application.preferredSlug)}</li>`
      : "",
    application.preferredCode
      ? `<li><strong>Preferred code:</strong> ${escapeHtml(application.preferredCode)}</li>`
      : "",
    `</ul>`,
    `<p><strong>Niche</strong><br>${escapeHtml(application.niche).replace(/\n/g, "<br>")}</p>`,
    `<p><strong>Pitch</strong><br>${escapeHtml(application.pitch).replace(/\n/g, "<br>")}</p>`,
    `<p><a href="${escapeHtml(adminUrl)}">Open orders admin</a> · ID ${escapeHtml(application.id)}</p>`,
  ]
    .filter(Boolean)
    .join("");

  await sendAdminEmail(subject, text, html);
}

/** Fire-and-forget gallery review photo email. */
export function notifyNewGalleryPhoto(submission: GallerySubmission): void {
  void notifyNewGalleryPhotoAsync(submission).catch((err) => {
    console.error("Admin notify gallery photo failed:", err);
  });
}

async function notifyNewGalleryPhotoAsync(
  submission: GallerySubmission
): Promise<void> {
  const adminUrl = `${siteBaseUrl()}/orders`;
  const sizeKb = Math.max(1, Math.round(submission.sizeBytes / 1024));

  const lines = [
    `New review photo on voronyz.com/gallery`,
    ``,
    `File: ${submission.originalFileName} (${sizeKb} KB)`,
    `Submission ID: ${submission.id}`,
    ``,
    `Approve or reject in admin: ${adminUrl}`,
  ];

  const subject = `Review photo pending`;
  const text = lines.join("\n");
  const html = [
    `<p><strong>New review photo</strong> waiting for approval on <a href="${escapeHtml(siteBaseUrl())}/gallery">voronyz.com/gallery</a></p>`,
    `<ul>`,
    `<li><strong>File:</strong> ${escapeHtml(submission.originalFileName)} (${sizeKb} KB)</li>`,
    `<li><strong>ID:</strong> ${escapeHtml(submission.id)}</li>`,
    `</ul>`,
    `<p><a href="${escapeHtml(adminUrl)}">Open admin to approve or reject</a></p>`,
  ].join("");

  await sendAdminEmail(subject, text, html);
}

/** Notify once per paid order (deduped via metadata.adminNotifySentAt). */
export function notifyPaidOrder(orderId: string): void {
  void notifyPaidOrderAsync(orderId).catch((err) => {
    console.error("Admin notify order failed:", err);
  });
}

async function notifyPaidOrderAsync(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || (order.status !== "paid" && order.status !== "preorder")) return;

  const metadata = isRecord(order.metadata) ? order.metadata : {};
  if (typeof metadata.adminNotifySentAt === "string") return;

  const sent = await sendOrderPaidEmail(order);
  if (!sent) return;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      metadata: {
        ...metadata,
        adminNotifySentAt: new Date().toISOString(),
      },
    },
  });
}

async function sendOrderPaidEmail(order: Order): Promise<boolean> {
  const parsed = parseOrderMetadata(order.metadata);
  const orderNumber = parsed.orderNumber ?? order.id.slice(0, 8);
  const adminUrl = `${siteBaseUrl()}/orders`;
  const isPreOrder = order.status === "preorder" || parsed.hasPreOrder;
  const orderKind = isPreOrder ? "pre-order" : "paid order";

  const itemLines = parsed.lineItems.map((item) => {
    const details = [
      item.isPreOrder ? "[Pre-order]" : null,
      item.productName ?? item.name,
      item.variantName,
      item.size ? `size ${item.size}` : null,
      item.baseColor,
      item.secondaryColor ? `+ ${item.secondaryColor}` : null,
    ]
      .filter(Boolean)
      .join(" · ");
    return `  • ${details} × ${item.quantity} — ${formatUsd(item.amount, order.currency)}`;
  });

  const shipBlock = formatShippingAddress(parsed.shipping);
  const paymentLabel =
    parsed.paymentMethod === "nano" ||
    order.stripeId?.startsWith("nano_")
      ? "Nano (XNO)"
      : parsed.paymentMethod === "ach"
        ? "ACH (bank transfer)"
        : parsed.paymentMethod === "card"
          ? "Card"
          : "Stripe";

  const lines = [
    `New ${orderKind} ${orderNumber}`,
    isPreOrder
      ? "Customer paid now and joined the waitlist — ship when product arrives."
      : null,
    ``,
    `Total: ${formatUsd(order.totalCents, order.currency)}`,
    `Payment: ${paymentLabel}`,
    parsed.customer?.name ? `Customer: ${parsed.customer.name}` : null,
    parsed.customer?.email ? `Email: ${parsed.customer.email}` : null,
    parsed.customer?.phone ? `Phone: ${parsed.customer.phone}` : null,
    shipBlock ? `\nShip to:\n${shipBlock}` : null,
    itemLines.length ? `\nItems:\n${itemLines.join("\n")}` : null,
    ``,
    `View in admin: ${adminUrl}`,
  ].filter(Boolean) as string[];

  const subject = `New ${orderKind} ${orderNumber} — ${formatUsd(order.totalCents, order.currency)}`;
  const text = lines.join("\n");

  const htmlItems = parsed.lineItems
    .map((item) => {
      const label = escapeHtml(
        [
          item.isPreOrder ? "[Pre-order]" : null,
          item.productName ?? item.name,
          item.variantName,
          item.size ? `size ${item.size}` : null,
        ]
          .filter(Boolean)
          .join(" · ")
      );
      return `<li>${label} × ${item.quantity} — ${escapeHtml(formatUsd(item.amount, order.currency))}</li>`;
    })
    .join("");

  const html = [
    `<p><strong>New ${escapeHtml(orderKind)} ${escapeHtml(orderNumber)}</strong></p>`,
    isPreOrder
      ? `<p>Customer paid now and joined the waitlist — ship when product arrives.</p>`
      : "",
    `<p><strong>Total:</strong> ${escapeHtml(formatUsd(order.totalCents, order.currency))}<br>`,
    `<strong>Payment:</strong> ${escapeHtml(paymentLabel)}</p>`,
    parsed.customer?.name || parsed.customer?.email
      ? `<p>${parsed.customer.name ? `<strong>${escapeHtml(parsed.customer.name)}</strong><br>` : ""}${
          parsed.customer.email
            ? `<a href="mailto:${escapeHtml(parsed.customer.email)}">${escapeHtml(parsed.customer.email)}</a><br>`
            : ""
        }${parsed.customer.phone ? escapeHtml(parsed.customer.phone) : ""}</p>`
      : "",
    shipBlock
      ? `<p><strong>Ship to:</strong><br>${escapeHtml(shipBlock).replace(/\n/g, "<br>")}</p>`
      : "",
    htmlItems ? `<ul>${htmlItems}</ul>` : "",
    `<p><a href="${escapeHtml(adminUrl)}">Open orders admin</a></p>`,
  ]
    .filter(Boolean)
    .join("");

  return sendAdminEmail(subject, text, html);
}
