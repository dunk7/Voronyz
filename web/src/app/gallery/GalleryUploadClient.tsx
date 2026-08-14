"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, ImagePlus, Loader2, Upload } from "lucide-react";
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
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export default function GalleryUploadClient() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const formStartedAtRef = useRef(Date.now());
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      callback: (token) => setTurnstileToken(token),
      "expired-callback": () => setTurnstileToken(""),
      "error-callback": () => setTurnstileToken(""),
    });
  }, []);

  useEffect(() => {
    if (TURNSTILE_SITE_KEY && window.turnstile) {
      renderTurnstile();
    }
  }, [renderTurnstile]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function onFileChange(next: File | null) {
    setError(null);
    setSuccessMessage(null);
    if (!next) {
      setFile(null);
      return;
    }
    if (!isImageUploadFile(next)) {
      setError("Please choose a JPEG, PNG, WebP, or HEIC photo.");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    try {
      const prepared = await prepareGalleryReviewImage(next);
      setFile(prepared);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that photo.");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!file) {
      setError("Please choose a review photo to upload.");
      return;
    }
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setError("Please complete the security check below.");
      return;
    }

    setSubmitting(true);
    try {
      const form = e.currentTarget;
      const company =
        (form.elements.namedItem("company") as HTMLInputElement | null)?.value ?? "";

      const formData = new FormData();
      formData.append("name", name.trim());
      if (email.trim()) formData.append("email", email.trim());
      if (caption.trim()) formData.append("caption", caption.trim());
      formData.append("company", company);
      formData.append("_formStartedAt", String(formStartedAtRef.current));
      if (turnstileToken) formData.append("cf-turnstile-response", turnstileToken);
      formData.append("file", file, file.name);

      const res = await fetch("/api/gallery/submit", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Upload failed. Please try again.");
      }

      setSuccessMessage(
        data.message ||
          "Thanks! Your review photo was submitted and will appear after we approve it."
      );
      setName("");
      setEmail("");
      setCaption("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      formStartedAtRef.current = Date.now();
      setTurnstileToken("");
      if (turnstileWidgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.reset(turnstileWidgetIdRef.current);
        } catch {
          renderTurnstile();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl bg-neutral-950 text-white ring-1 ring-white/10 overflow-hidden">
      {TURNSTILE_SITE_KEY ? (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={renderTurnstile}
        />
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        <div className="lg:col-span-5 px-5 py-6 sm:px-7 sm:py-8 space-y-3 border-b lg:border-b-0 lg:border-r border-white/10">
          <p className="text-[11px] uppercase tracking-[0.28em] text-white/50">
            Community
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Upload a review photo
          </h2>
          <p className="text-sm text-white/65 leading-relaxed max-w-md">
            Share a photo of your Voronyz footwear in the wild. Submissions are
            reviewed before they appear in the gallery — no spam, no unrelated
            images.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="lg:col-span-7 px-5 py-6 sm:px-7 sm:py-8 space-y-4"
        >
          {/* Honeypot */}
          <div className="absolute -left-[9999px] opacity-0 h-0 overflow-hidden" aria-hidden>
            <label htmlFor="gallery-company">Company</label>
            <input
              id="gallery-company"
              name="company"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-white/70">Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={120}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-white/20"
                placeholder="Your name"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-white/70">
                Email <span className="text-white/40">(optional)</span>
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={254}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-white/20"
                placeholder="you@email.com"
              />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-white/70">
              Caption <span className="text-white/40">(optional)</span>
            </span>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={280}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-white/20"
              placeholder="Where are you wearing them?"
            />
          </label>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-stretch">
            <label className="flex-1 flex items-center gap-3 rounded-xl border border-dashed border-white/20 bg-white/[0.03] px-4 py-3 cursor-pointer hover:bg-white/[0.06] transition">
              <ImagePlus className="h-5 w-5 text-white/60 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">
                  {file ? file.name : "Choose review photo"}
                </p>
                <p className="text-xs text-white/45 truncate">
                  JPEG, PNG, WebP, or HEIC · max 8 MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
                className="sr-only"
                onChange={(e) => void onFileChange(e.target.files?.[0] ?? null)}
              />
            </label>

            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Preview"
                className="h-24 w-24 sm:h-auto sm:w-28 rounded-xl object-cover ring-1 ring-white/15 shrink-0"
              />
            ) : null}
          </div>

          {TURNSTILE_SITE_KEY ? (
            <div ref={turnstileRef} className="min-h-[65px]" />
          ) : null}

          {error ? (
            <p className="rounded-xl bg-red-500/15 border border-red-400/30 px-4 py-3 text-sm text-red-100">
              {error}
            </p>
          ) : null}

          {successMessage ? (
            <p className="rounded-xl bg-emerald-500/15 border border-emerald-400/30 px-4 py-3 text-sm text-emerald-100 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{successMessage}</span>
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-black px-6 py-3 text-sm font-semibold hover:bg-neutral-100 disabled:opacity-60 transition"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {submitting ? "Submitting…" : "Submit for review"}
          </button>
        </form>
      </div>
    </section>
  );
}
