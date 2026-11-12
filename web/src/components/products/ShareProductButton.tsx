"use client";

import { useState } from "react";
import {
  PRODUCT_SHARE_BRAND,
  buildShareCaption,
  cleanShareDescription,
  truncateShareText,
} from "@/lib/productShare";

type ShareProductButtonProps = {
  productName?: string;
  productSlug?: string;
  productDescription?: string;
  imageUrl?: string;
};

const SHARE_CARD_SIZE = 1080;

function productUrl(slug?: string) {
  if (typeof window === "undefined") return "";
  if (slug) {
    return `${window.location.origin}/products/${slug}`;
  }
  return window.location.href.split("#")[0];
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const input = document.createElement("textarea");
  input.value = text;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.left = "-9999px";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  document.body.removeChild(input);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load share image"));
    img.src = src;
  });
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length >= maxLines - 1) break;
  }

  if (lines.length < maxLines && current) {
    if (lines.length === maxLines - 1 && ctx.measureText(current).width > maxWidth) {
      let clipped = current;
      while (clipped.length > 1 && ctx.measureText(`${clipped}…`).width > maxWidth) {
        clipped = clipped.slice(0, -1);
      }
      lines.push(`${clipped}…`);
    } else {
      lines.push(current);
    }
  } else if (lines.length === maxLines - 1 && current) {
    let clipped = current;
    while (clipped.length > 1 && ctx.measureText(`${clipped}…`).width > maxWidth) {
      clipped = clipped.slice(0, -1);
    }
    lines.push(`${clipped}…`);
  }

  return lines.slice(0, maxLines);
}

/**
 * Branded square card so Instagram Stories/posts still show Voronyz + title + link
 * even when the app only keeps the image.
 */
async function brandedShareCard({
  imageUrl,
  productName,
  productDescription,
  url,
}: {
  imageUrl?: string;
  productName?: string;
  productDescription?: string;
  url: string;
}): Promise<File | null> {
  if (!imageUrl || typeof document === "undefined") return null;

  try {
    const absolute =
      imageUrl.startsWith("http://") || imageUrl.startsWith("https://")
        ? imageUrl
        : new URL(imageUrl, window.location.origin).toString();
    const photo = await loadImage(absolute);
    const canvas = document.createElement("canvas");
    canvas.width = SHARE_CARD_SIZE;
    canvas.height = SHARE_CARD_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const bg = ctx.createLinearGradient(0, 0, 0, SHARE_CARD_SIZE);
    bg.addColorStop(0, "#161616");
    bg.addColorStop(1, "#2a2a2a");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, SHARE_CARD_SIZE, SHARE_CARD_SIZE);

    const photoArea = { x: 72, y: 150, w: SHARE_CARD_SIZE - 144, h: 620 };
    const scale = Math.min(photoArea.w / photo.naturalWidth, photoArea.h / photo.naturalHeight);
    const drawW = photo.naturalWidth * scale;
    const drawH = photo.naturalHeight * scale;
    const drawX = photoArea.x + (photoArea.w - drawW) / 2;
    const drawY = photoArea.y + (photoArea.h - drawH) / 2;
    ctx.fillStyle = "#0f0f0f";
    ctx.fillRect(photoArea.x, photoArea.y, photoArea.w, photoArea.h);
    ctx.drawImage(photo, drawX, drawY, drawW, drawH);

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 54px 'Helvetica Neue', Helvetica, Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(PRODUCT_SHARE_BRAND.toUpperCase(), 72, 96);

    const title = productName?.trim() || PRODUCT_SHARE_BRAND;
    ctx.font = "600 44px 'Helvetica Neue', Helvetica, Arial, sans-serif";
    const titleLines = wrapLines(ctx, title, SHARE_CARD_SIZE - 144, 2);
    titleLines.forEach((line, index) => {
      ctx.fillText(line, 72, 820 + index * 52);
    });

    const description = truncateShareText(cleanShareDescription(productDescription), 110);
    let linkY = 820 + titleLines.length * 52 + 28;
    if (description) {
      ctx.fillStyle = "rgba(255,255,255,0.78)";
      ctx.font = "400 28px 'Helvetica Neue', Helvetica, Arial, sans-serif";
      const descLines = wrapLines(ctx, description, SHARE_CARD_SIZE - 144, 2);
      descLines.forEach((line, index) => {
        ctx.fillText(line, 72, linkY + index * 36);
      });
      linkY += descLines.length * 36 + 24;
    }

    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "500 26px 'Helvetica Neue', Helvetica, Arial, sans-serif";
    const linkLabel = url.replace(/^https?:\/\//, "");
    const linkLines = wrapLines(ctx, linkLabel, SHARE_CARD_SIZE - 144, 1);
    ctx.fillText(linkLines[0] || linkLabel, 72, Math.min(linkY, SHARE_CARD_SIZE - 48));

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92),
    );
    if (!blob) return null;

    const file = new File([blob], "voronyz-share.jpg", { type: "image/jpeg" });
    if (typeof navigator.canShare === "function" && !navigator.canShare({ files: [file] })) {
      return null;
    }
    return file;
  } catch {
    return null;
  }
}

export default function ShareProductButton({
  productName,
  productSlug,
  productDescription,
  imageUrl,
}: ShareProductButtonProps) {
  const [status, setStatus] = useState<"idle" | "sharing" | "copied" | "error">("idle");

  async function share() {
    if (status === "sharing") return;
    setStatus("sharing");

    const url = productUrl(productSlug);
    const title = `${productName?.trim() || PRODUCT_SHARE_BRAND} · ${PRODUCT_SHARE_BRAND}`;
    const caption = buildShareCaption({
      productName,
      productDescription,
      url,
    });

    try {
      const card = await brandedShareCard({
        imageUrl,
        productName,
        productDescription,
        url,
      });

      if (typeof navigator.share === "function") {
        // Prefer branded card + caption + link. Avoid bare product photos —
        // Instagram often keeps only the image and drops the rest.
        const richPayload: ShareData = card
          ? { title, text: caption, url, files: [card] }
          : { title, text: caption, url };

        try {
          await navigator.share(richPayload);
          setStatus("idle");
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            setStatus("idle");
            return;
          }
          try {
            await navigator.share({ title, text: caption, url });
            setStatus("idle");
            return;
          } catch (retryError) {
            if (retryError instanceof DOMException && retryError.name === "AbortError") {
              setStatus("idle");
              return;
            }
          }
        }
      }

      await copyText(caption);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 5000);
    } catch {
      setStatus("error");
      window.setTimeout(() => setStatus("idle"), 4000);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={share}
        disabled={status === "sharing"}
        aria-label="Share this product to Instagram"
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-medium text-neutral-900 ring-1 ring-black/10 transition hover:bg-black/5 disabled:cursor-wait disabled:opacity-60"
      >
        <span
          aria-hidden
          className="inline-flex h-5 w-5 items-center justify-center rounded-[6px] bg-[linear-gradient(45deg,#f09433_0%,#e6683c_25%,#dc2743_50%,#cc2366_75%,#bc1888_100%)] text-white"
        >
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden>
            <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5.2A4.8 4.8 0 1 0 16.8 12 4.8 4.8 0 0 0 12 7.2zm0 7.9A3.1 3.1 0 1 1 15.1 12 3.1 3.1 0 0 1 12 15.1zM17.6 6a1.1 1.1 0 1 0 1.1 1.1A1.1 1.1 0 0 0 17.6 6z" />
          </svg>
        </span>
        {status === "sharing"
          ? "Preparing share…"
          : status === "copied"
            ? "Caption copied"
            : status === "error"
              ? "Couldn’t share — try again"
              : "Share to Instagram"}
      </button>
      {status === "copied" ? (
        <p className="text-center text-xs text-neutral-500">
          Copied Voronyz, the product title, description, and link — paste into an Instagram Story, Reel, or post.{" "}
          <a
            href="https://www.instagram.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-neutral-800"
          >
            Open Instagram
          </a>
        </p>
      ) : (
        <p className="text-center text-xs text-neutral-400">
          Shares Voronyz, the title, description, and product link — not just a photo.
        </p>
      )}
    </div>
  );
}
