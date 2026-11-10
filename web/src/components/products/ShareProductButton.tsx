"use client";

import { useState } from "react";

type ShareProductButtonProps = {
  productName?: string;
  productSlug?: string;
  imageUrl?: string;
};

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

async function imageFileForShare(imageUrl?: string): Promise<File | null> {
  if (!imageUrl) return null;
  try {
    const absolute =
      imageUrl.startsWith("http://") || imageUrl.startsWith("https://")
        ? imageUrl
        : new URL(imageUrl, window.location.origin).toString();
    const response = await fetch(absolute);
    if (!response.ok) return null;
    const blob = await response.blob();
    if (!blob.type.startsWith("image/")) return null;
    const extension = blob.type.includes("png")
      ? "png"
      : blob.type.includes("webp")
        ? "webp"
        : "jpg";
    const file = new File([blob], `voronyz-product.${extension}`, {
      type: blob.type || "image/jpeg",
    });
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
  imageUrl,
}: ShareProductButtonProps) {
  const [status, setStatus] = useState<"idle" | "sharing" | "copied" | "error">("idle");

  async function share() {
    if (status === "sharing") return;
    setStatus("sharing");

    const url = productUrl(productSlug);
    const title = productName?.trim() || "Voronyz";
    const text = `Check out ${title} from Voronyz`;

    try {
      const file = await imageFileForShare(imageUrl);
      const payload: ShareData = file
        ? { title, text, url, files: [file] }
        : { title, text, url };

      if (typeof navigator.share === "function") {
        try {
          await navigator.share(payload);
          setStatus("idle");
          return;
        } catch (error) {
          // User dismissed the sheet — don't fall through to clipboard noise.
          if (error instanceof DOMException && error.name === "AbortError") {
            setStatus("idle");
            return;
          }
          // Some browsers reject files+url; retry text/url only.
          if (file && typeof navigator.share === "function") {
            try {
              await navigator.share({ title, text, url });
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
      }

      await copyText(url);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 4000);
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
          ? "Opening share…"
          : status === "copied"
            ? "Link copied"
            : status === "error"
              ? "Couldn’t share — try again"
              : "Share to Instagram"}
      </button>
      {status === "copied" ? (
        <p className="text-center text-xs text-neutral-500">
          Link copied. Open Instagram and paste it into a Story, Reel, or post — same idea as sharing a TikTok.{" "}
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
          On your phone, pick Instagram from the share sheet.
        </p>
      )}
    </div>
  );
}
