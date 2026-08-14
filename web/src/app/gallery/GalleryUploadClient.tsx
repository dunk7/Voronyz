"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Upload } from "lucide-react";
import {
  isImageUploadFile,
  prepareGalleryReviewImage,
} from "@/lib/prepareImageUpload";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          size?: "normal" | "compact" | "flexible";
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export default function GalleryUploadClient() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [needsTurnstile, setNeedsTurnstile] = useState(false);
  const pendingFileRef = useRef<File | null>(null);
  const formStartedAtRef = useRef(Date.now());
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);

  const renderTurnstile = useCallback(() => {
    if (!TURNSTILE_SITE_KEY || !turnstileRef.current || !window.turnstile) return;
    if (turnstileWidgetIdRef.current) {
      try {
        window.turnstile.remove(turnstileWidgetIdRef.current);
      } catch {
        /* ignore */
      }
      turnstileWidgetIdRef.current = null;
    }
    turnstileWidgetIdRef.current = window.turnstile.render(turnstileRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      size: "compact",
      callback: (token) => setTurnstileToken(token),
      "expired-callback": () => setTurnstileToken(""),
      "error-callback": () => setTurnstileToken(""),
    });
  }, []);

  useEffect(() => {
    if (needsTurnstile && TURNSTILE_SITE_KEY && window.turnstile) {
      renderTurnstile();
    }
  }, [needsTurnstile, renderTurnstile]);

  const resetTurnstile = useCallback(() => {
    setTurnstileToken("");
    if (turnstileWidgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(turnstileWidgetIdRef.current);
      } catch {
        renderTurnstile();
      }
    }
  }, [renderTurnstile]);

  const submitFile = useCallback(
    async (file: File, token: string) => {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      // Clear pending before await so Turnstile auto-submit cannot loop on failure.
      pendingFileRef.current = null;
      try {
        const formData = new FormData();
        formData.append("company", honeypotRef.current?.value ?? "");
        formData.append("_formStartedAt", String(formStartedAtRef.current));
        if (token) formData.append("cf-turnstile-response", token);
        formData.append("file", file, file.name);

        const res = await fetch("/api/gallery/submit", {
          method: "POST",
          body: formData,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || "Upload failed. Please try again.");
        }

        setSuccessMessage("Submitted — pending approval.");
        setNeedsTurnstile(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        formStartedAtRef.current = Date.now();
        resetTurnstile();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
        setNeedsTurnstile(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        resetTurnstile();
      } finally {
        setSubmitting(false);
      }
    },
    [resetTurnstile]
  );

  // Auto-submit once Turnstile token arrives for a pending file
  useEffect(() => {
    const pending = pendingFileRef.current;
    if (!pending || !turnstileToken || submitting) return;
    void submitFile(pending, turnstileToken);
  }, [turnstileToken, submitting, submitFile]);

  async function onFileChange(next: File | null) {
    setError(null);
    setSuccessMessage(null);
    pendingFileRef.current = null;

    if (!next) return;

    if (!isImageUploadFile(next)) {
      setError("Please choose a JPEG, PNG, WebP, or HEIC photo.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      const prepared = await prepareGalleryReviewImage(next);
      if (TURNSTILE_SITE_KEY && !turnstileToken) {
        pendingFileRef.current = prepared;
        setNeedsTurnstile(true);
        return;
      }
      await submitFile(prepared, turnstileToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that photo.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="relative flex flex-col items-end gap-2">
      {TURNSTILE_SITE_KEY ? (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={() => {
            if (needsTurnstile) renderTurnstile();
          }}
        />
      ) : null}

      {/* Honeypot */}
      <div className="absolute -left-[9999px] opacity-0 h-0 overflow-hidden" aria-hidden>
        <label htmlFor="gallery-company">Company</label>
        <input
          ref={honeypotRef}
          id="gallery-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
        className="sr-only"
        onChange={(e) => void onFileChange(e.target.files?.[0] ?? null)}
      />

      <button
        type="button"
        disabled={submitting}
        onClick={() => fileInputRef.current?.click()}
        className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-60 transition"
      >
        {submitting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Upload className="h-3.5 w-3.5" />
        )}
        {submitting ? "Uploading…" : "Upload review photo"}
      </button>

      {needsTurnstile && !turnstileToken ? (
        <div ref={turnstileRef} className="min-h-[65px]" />
      ) : null}

      {error ? (
        <p className="max-w-[16rem] text-right text-xs text-red-600">{error}</p>
      ) : null}

      {successMessage ? (
        <p className="flex max-w-[16rem] items-center justify-end gap-1 text-right text-xs text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          <span>{successMessage}</span>
        </p>
      ) : null}
    </div>
  );
}
