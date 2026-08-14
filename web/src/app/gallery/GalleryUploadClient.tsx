"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ImagePlus, Loader2 } from "lucide-react";
import {
  isImageUploadFile,
  prepareGalleryReviewImage,
} from "@/lib/prepareImageUpload";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

type TurnstileApi = {
  render: (
    el: HTMLElement,
    options: Record<string, unknown>
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

function getTurnstile(): TurnstileApi | undefined {
  return (window as unknown as { turnstile?: TurnstileApi }).turnstile;
}

export default function GalleryUploadClient() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const formStartedAtRef = useRef(Date.now() - 5000);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const renderTurnstile = useCallback(() => {
    const turnstile = getTurnstile();
    if (!TURNSTILE_SITE_KEY || !turnstileRef.current || !turnstile) return;
    if (turnstileWidgetIdRef.current) {
      try {
        turnstile.remove(turnstileWidgetIdRef.current);
      } catch {
        /* ignore */
      }
      turnstileWidgetIdRef.current = null;
    }
    turnstileWidgetIdRef.current = turnstile.render(turnstileRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      size: "invisible",
      callback: (token: string) => setTurnstileToken(token),
      "expired-callback": () => setTurnstileToken(""),
      "error-callback": () => setTurnstileToken(""),
    });
  }, []);

  useEffect(() => {
    if (TURNSTILE_SITE_KEY && getTurnstile()) {
      renderTurnstile();
    }
  }, [renderTurnstile]);

  async function uploadFile(file: File) {
    setError(null);
    setDone(false);
    setSubmitting(true);
    try {
      if (!isImageUploadFile(file)) {
        throw new Error("Choose a photo.");
      }
      if (TURNSTILE_SITE_KEY && !turnstileToken) {
        throw new Error("Security check still loading — try again.");
      }

      const prepared = await prepareGalleryReviewImage(file);
      const formData = new FormData();
      formData.append("company", "");
      formData.append("_formStartedAt", String(formStartedAtRef.current));
      if (turnstileToken) formData.append("cf-turnstile-response", turnstileToken);
      formData.append("file", prepared, prepared.name);

      const res = await fetch("/api/gallery/submit", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Upload failed.");
      }

      setDone(true);
      formStartedAtRef.current = Date.now() - 5000;
      setTurnstileToken("");
      const turnstile = getTurnstile();
      if (turnstileWidgetIdRef.current && turnstile) {
        try {
          turnstile.reset(turnstileWidgetIdRef.current);
        } catch {
          renderTurnstile();
        }
      }
      window.setTimeout(() => setDone(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setSubmitting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="relative aspect-square overflow-hidden rounded-lg sm:rounded-xl bg-neutral-100 ring-1 ring-black/5">
      {TURNSTILE_SITE_KEY ? (
        <>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="afterInteractive"
            onLoad={renderTurnstile}
          />
          <div ref={turnstileRef} className="sr-only" aria-hidden />
        </>
      ) : null}

      <label
        className={`absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-2 px-3 text-center transition ${
          submitting ? "pointer-events-none opacity-70" : "hover:bg-neutral-200/60"
        }`}
      >
        {submitting ? (
          <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
        ) : done ? (
          <Check className="h-6 w-6 text-emerald-600" />
        ) : (
          <ImagePlus className="h-6 w-6 text-neutral-500" />
        )}
        <span className="text-[11px] sm:text-xs font-medium tracking-wide text-neutral-700">
          {submitting
            ? "Uploading…"
            : done
              ? "Submitted"
              : "Upload review photo"}
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
          className="sr-only"
          disabled={submitting}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadFile(file);
          }}
        />
      </label>

      {error ? (
        <p className="pointer-events-none absolute inset-x-1 bottom-1 rounded-md bg-red-50/95 px-2 py-1 text-[10px] leading-snug text-red-700 sm:text-[11px]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
