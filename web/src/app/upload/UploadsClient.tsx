"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Upload } from "lucide-react";
import { uploadStlFile } from "@/lib/uploadStlFile.client";
import { STL_DIRECT_UPLOAD_MAX_BYTES } from "@/lib/stlUploadValidation";

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

export default function UploadsClient() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [customizationRequest, setCustomizationRequest] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const formStartedAtRef = useRef(Date.now());
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);

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

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!file) {
      setError("Please choose a file to upload.");
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
    setUploadProgress(null);
    try {
      const form = e.currentTarget;
      const company =
        (form.elements.namedItem("company") as HTMLInputElement | null)?.value ?? "";

      const result = await uploadStlFile(
        file,
        {
          name,
          email,
          customizationRequest,
          company,
          formStartedAt: formStartedAtRef.current,
          turnstileToken,
        },
        {
          onProgress:
            file.size > STL_DIRECT_UPLOAD_MAX_BYTES
              ? (fraction) => setUploadProgress(fraction)
              : undefined,
        }
      );

      setSuccessMessage(result.message);
      setName("");
      setEmail("");
      setCustomizationRequest("");
      setFile(null);
      formStartedAtRef.current = Date.now();
      const input = document.getElementById("upload-file-input") as HTMLInputElement | null;
      if (input) input.value = "";
      if (TURNSTILE_SITE_KEY && window.turnstile && turnstileWidgetIdRef.current) {
        window.turnstile.reset(turnstileWidgetIdRef.current);
        setTurnstileToken("");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Network error. Check your connection and try again."
      );
      if (TURNSTILE_SITE_KEY && window.turnstile && turnstileWidgetIdRef.current) {
        window.turnstile.reset(turnstileWidgetIdRef.current);
        setTurnstileToken("");
      }
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  }

  if (successMessage) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" aria-hidden />
        <h2 className="mt-4 text-xl font-semibold text-neutral-900">Upload received</h2>
        <p className="mt-2 text-neutral-600">{successMessage}</p>
        <button
          type="button"
          onClick={() => setSuccessMessage(null)}
          className="mt-6 rounded-full bg-black px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Submit another file
        </button>
      </div>
    );
  }

  return (
    <>
      {TURNSTILE_SITE_KEY ? (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={renderTurnstile}
        />
      ) : null}

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Honeypot — hidden from humans, bots often fill it */}
        <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
          <label htmlFor="company">Company</label>
          <input
            id="company"
            name="company"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div>
          <label htmlFor="upload-file-input" className="mb-2 block text-sm font-medium text-neutral-700">
            File <span className="text-red-600">*</span>
          </label>
          <div className="rounded-xl border-2 border-dashed border-black/15 bg-white p-6">
            <input
              id="upload-file-input"
              name="file"
              type="file"
              required
              className="block w-full text-sm text-neutral-700 file:mr-4 file:rounded-full file:border-0 file:bg-black file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-neutral-800"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <p className="mt-3 text-sm text-neutral-600">
                Selected: <span className="font-medium text-neutral-900">{file.name}</span>{" "}
                ({(file.size / (1024 * 1024)).toFixed(2)} MB)
              </p>
            ) : (
              <p className="mt-3 text-sm text-neutral-500">Maximum file size: 50 MB</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="upload-name" className="mb-2 block text-sm font-medium text-neutral-700">
            Your name <span className="text-red-600">*</span>
          </label>
          <input
            id="upload-name"
            name="name"
            type="text"
            required
            maxLength={120}
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-black/10 px-4 py-3 text-neutral-900 focus:border-transparent focus:ring-2 focus:ring-black"
            placeholder="Jane Doe"
          />
        </div>

        <div>
          <label htmlFor="upload-email" className="mb-2 block text-sm font-medium text-neutral-700">
            Email <span className="text-neutral-400">(optional)</span>
          </label>
          <input
            id="upload-email"
            name="email"
            type="email"
            maxLength={254}
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-black/10 px-4 py-3 text-neutral-900 focus:border-transparent focus:ring-2 focus:ring-black"
            placeholder="you@example.com"
          />
          <p className="mt-1 text-xs text-neutral-500">
            Include your email if you want us to reply about your design.
          </p>
        </div>

        <div>
          <label
            htmlFor="upload-customization"
            className="mb-2 block text-sm font-medium text-neutral-700"
          >
            Customization requests <span className="text-neutral-400">(optional)</span>
          </label>
          <textarea
            id="upload-customization"
            name="customizationRequest"
            rows={5}
            maxLength={4000}
            value={customizationRequest}
            onChange={(e) => setCustomizationRequest(e.target.value)}
            className="w-full resize-none rounded-xl border border-black/10 px-4 py-3 text-neutral-900 focus:border-transparent focus:ring-2 focus:ring-black"
            placeholder="Size, color preferences, fit notes, or other requests…"
          />
        </div>

        {TURNSTILE_SITE_KEY ? (
          <div ref={turnstileRef} className="min-h-[65px]" />
        ) : null}

        {error ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {error}
          </p>
        ) : null}

        {uploadProgress !== null ? (
          <div>
            <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full rounded-full bg-black transition-all duration-300"
                style={{ width: `${Math.round(uploadProgress * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-center text-sm text-neutral-600">
              Uploading… {Math.round(uploadProgress * 100)}%
            </p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-6 py-3.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Uploading…
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" aria-hidden />
              Submit file
            </>
          )}
        </button>
      </form>
    </>
  );
}
