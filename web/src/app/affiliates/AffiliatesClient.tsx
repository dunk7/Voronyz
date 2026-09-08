"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AFFILIATE_AUDIENCE_SIZES,
  AFFILIATE_PLATFORMS,
} from "@/lib/affiliateConstants";

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

const STEPS = [
  {
    id: "learn",
    title: "1. Learn how Voronyz affiliates work",
    body: [
      "Voronyz affiliates and creators get a personal short link (like voronyz.com/yourname) and a matching discount code for their audience.",
      "When someone opens your link, the discount is applied automatically in cart. We track clicks and orders tied to your code so we can see what’s working.",
      "Partnership terms (product, commission, or custom codes) are set after we review your application — not every creator gets the same deal.",
    ],
  },
  {
    id: "fit",
    title: "2. Make sure you’re a good fit",
    body: [
      "We look for creators who actually wear or care about footwear, outdoor, tech, or lifestyle content — and who can post honestly.",
      "Audience size helps, but engagement and fit matter more. Small, trusted audiences often outperform huge ones that never convert.",
      "You should be comfortable sharing a clear call-to-action and answering simple product questions from your community.",
    ],
  },
  {
    id: "apply",
    title: "3. Fill out the application on this page",
    body: [
      "Use the form below with your real contact info, primary platform, handle or profile URL, and audience size.",
      "Tell us your niche and how you’d promote Voronyz (Reels, TikToks, YouTube, stories, live streams, etc.).",
      "Optional: suggest a short-link slug and discount code name. We’ll confirm availability if you’re approved.",
    ],
  },
  {
    id: "review",
    title: "4. We review your application",
    body: [
      "Our team reads every submission. Most reviews happen within a few business days.",
      "If something’s missing (broken link, unclear niche), we may email you before deciding.",
      "Approval is selective — applying does not guarantee a code or link.",
    ],
  },
  {
    id: "setup",
    title: "5. Get your short link and code",
    body: [
      "If approved, we create your live short link and discount code on voronyz.com.",
      "You’ll get the exact URL to share (for example voronyz.com/yourname) plus the code that auto-applies for shoppers.",
      "Keep the link in your bio, link-in-bio tools, videos, and captions so tracking stays accurate.",
    ],
  },
  {
    id: "promote",
    title: "6. Promote and grow with us",
    body: [
      "Share product photos, try-ons, and honest reviews. Mention that your audience gets a discount through your link.",
      "We track link clicks and discounted orders in our admin tools so we can follow performance together.",
      "As results grow, we can adjust codes, creatives, or partnership terms.",
    ],
  },
] as const;

const inputClass =
  "w-full px-4 py-3 border border-neutral-400 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-neutral-900 bg-white";

export default function AffiliatesClient() {
  const [openStep, setOpenStep] = useState<string>("learn");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [platform, setPlatform] = useState<(typeof AFFILIATE_PLATFORMS)[number] | "">(
    ""
  );
  const [handleOrUrl, setHandleOrUrl] = useState("");
  const [audienceSize, setAudienceSize] = useState<
    (typeof AFFILIATE_AUDIENCE_SIZES)[number] | ""
  >("");
  const [preferredSlug, setPreferredSlug] = useState("");
  const [preferredCode, setPreferredCode] = useState("");
  const [niche, setNiche] = useState("");
  const [pitch, setPitch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
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

    if (!platform) {
      setError("Please choose your primary platform.");
      return;
    }
    if (!audienceSize) {
      setError("Please select your audience size.");
      return;
    }
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setError("Please complete the security check below.");
      return;
    }

    const form = e.currentTarget;
    const company =
      (form.elements.namedItem("company") as HTMLInputElement | null)?.value ?? "";

    setSubmitting(true);
    try {
      const res = await fetch("/api/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          platform,
          handleOrUrl,
          audienceSize,
          preferredSlug,
          preferredCode,
          niche,
          pitch,
          company,
          _formStartedAt: formStartedAtRef.current,
          turnstileToken,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || "Could not submit your application.");
      }

      setSuccessMessage(
        data.message ||
          "Thanks — we received your affiliate application and will review it soon."
      );
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setPlatform("");
      setHandleOrUrl("");
      setAudienceSize("");
      setPreferredSlug("");
      setPreferredCode("");
      setNiche("");
      setPitch("");
      formStartedAtRef.current = Date.now();
      setTurnstileToken("");
      if (TURNSTILE_SITE_KEY && window.turnstile && turnstileWidgetIdRef.current) {
        window.turnstile.reset(turnstileWidgetIdRef.current);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      if (TURNSTILE_SITE_KEY && window.turnstile && turnstileWidgetIdRef.current) {
        window.turnstile.reset(turnstileWidgetIdRef.current);
      }
      setTurnstileToken("");
    } finally {
      setSubmitting(false);
    }
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

      {/* How it works — accordion dropdowns */}
      <section id="how-it-works" className="bg-neutral-50 py-20 scroll-mt-28">
        <div className="container max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              How to become an affiliate
            </h2>
            <p className="text-neutral-600 max-w-2xl mx-auto">
              Open each step for details. When you&apos;re ready, submit the application
              form on this page — no email chain required to get started.
            </p>
          </div>

          <div id="steps" className="space-y-3 scroll-mt-28">
            {STEPS.map((step) => {
              const open = openStep === step.id;
              return (
                <div
                  key={step.id}
                  className="border border-neutral-200 bg-white overflow-hidden"
                >
                  <button
                    type="button"
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-neutral-50 transition-colors"
                    aria-expanded={open}
                    onClick={() => setOpenStep(open ? "" : step.id)}
                  >
                    <span className="text-base font-semibold text-neutral-900">
                      {step.title}
                    </span>
                    <span
                      className={`text-neutral-500 text-xl leading-none transition-transform ${
                        open ? "rotate-180" : ""
                      }`}
                      aria-hidden
                    >
                      ▾
                    </span>
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                      open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-5 pb-5 space-y-3 border-t border-neutral-100 pt-4">
                        {step.body.map((paragraph) => (
                          <p key={paragraph} className="text-neutral-600 leading-relaxed">
                            {paragraph}
                          </p>
                        ))}
                        {step.id === "apply" ? (
                          <a
                            href="#apply"
                            className="inline-flex text-sm font-medium text-neutral-900 underline underline-offset-4 hover:text-neutral-600"
                          >
                            Jump to application form
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Application form */}
      <section id="apply" className="container py-20 scroll-mt-28">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-neutral-900 mb-3">
            Affiliate application
          </h2>
          <p className="text-neutral-600 mb-10 leading-relaxed">
            Apply directly through Voronyz. We&apos;ll email you after review with next
            steps, or with questions if we need more info.
          </p>

          {successMessage ? (
            <div
              className="mb-8 rounded-lg border border-neutral-300 bg-neutral-50 px-5 py-4 text-neutral-800"
              role="status"
            >
              {successMessage}
            </div>
          ) : null}

          <form className="space-y-6" onSubmit={onSubmit} noValidate>
            {/* Honeypot */}
            <div className="absolute -left-[9999px] opacity-0 h-0 w-0 overflow-hidden" aria-hidden>
              <label htmlFor="affiliate-company">Company</label>
              <input
                id="affiliate-company"
                name="company"
                type="text"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  First name
                </label>
                <input
                  required
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={inputClass}
                  placeholder="Alex"
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Last name
                </label>
                <input
                  required
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputClass}
                  placeholder="Rivera"
                  autoComplete="family-name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Email
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Phone <span className="text-neutral-400 font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
                placeholder="206 555 0100"
                autoComplete="tel"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Primary platform
                </label>
                <select
                  required
                  value={platform}
                  onChange={(e) =>
                    setPlatform(e.target.value as (typeof AFFILIATE_PLATFORMS)[number] | "")
                  }
                  className={inputClass}
                >
                  <option value="">Select platform</option>
                  {AFFILIATE_PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Audience size
                </label>
                <select
                  required
                  value={audienceSize}
                  onChange={(e) =>
                    setAudienceSize(
                      e.target.value as (typeof AFFILIATE_AUDIENCE_SIZES)[number] | ""
                    )
                  }
                  className={inputClass}
                >
                  <option value="">Select range</option>
                  {AFFILIATE_AUDIENCE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Handle or profile URL
              </label>
              <input
                required
                type="text"
                value={handleOrUrl}
                onChange={(e) => setHandleOrUrl(e.target.value)}
                className={inputClass}
                placeholder="@yourname or https://…"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Preferred short link{" "}
                  <span className="text-neutral-400 font-normal">(optional)</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-500 shrink-0">voronyz.com/</span>
                  <input
                    type="text"
                    value={preferredSlug}
                    onChange={(e) => setPreferredSlug(e.target.value)}
                    className={inputClass}
                    placeholder="yourname"
                    autoCapitalize="off"
                    autoCorrect="off"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Preferred code{" "}
                  <span className="text-neutral-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={preferredCode}
                  onChange={(e) => setPreferredCode(e.target.value)}
                  className={inputClass}
                  placeholder="yourname50"
                  autoCapitalize="off"
                  autoCorrect="off"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Niche &amp; content style
              </label>
              <textarea
                required
                rows={3}
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className={`${inputClass} resize-y min-h-[96px]`}
                placeholder="What do you create? Who follows you? What products fit your feed?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                How would you promote Voronyz?
              </label>
              <textarea
                required
                rows={5}
                value={pitch}
                onChange={(e) => setPitch(e.target.value)}
                className={`${inputClass} resize-y min-h-[140px]`}
                placeholder="Describe your plan: posts per month, formats, past brand work, why Voronyz fits your audience…"
              />
            </div>

            {TURNSTILE_SITE_KEY ? (
              <div ref={turnstileRef} className="min-h-[65px]" />
            ) : null}

            {error ? (
              <p className="text-sm text-red-700" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-black text-white py-3.5 px-6 rounded-lg hover:bg-neutral-800 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting…" : "Submit affiliate application"}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
