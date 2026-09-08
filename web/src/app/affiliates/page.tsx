import type { Metadata } from "next";
import Link from "next/link";
import AffiliatesClient from "./AffiliatesClient";

export const metadata: Metadata = {
  title: "Become a Voronyz Affiliate",
  description:
    "Apply to the Voronyz affiliate program. Get a personal short link and discount code for your audience — step-by-step guide and on-site application.",
};

export default function AffiliatesPage() {
  return (
    <div className="bg-texture-white">
      <div className="relative overflow-hidden bg-gradient-to-br from-neutral-50 to-neutral-100">
        <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center opacity-5" />
        <div className="relative container py-24 text-center">
          <p className="uppercase tracking-[0.25em] text-xs text-neutral-500 mb-4">
            Voronyz partners
          </p>
          <h1 className="text-4xl md:text-6xl font-bold text-neutral-900 mb-6">
            Become a Voronyz
            <br />
            affiliate
          </h1>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed mb-10">
            Share footwear your audience will actually wear. Get a tracked short link,
            a personal discount code, and a direct path to partner with Voronyz —
            start with the steps below, then apply on this page.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-black text-white rounded-full hover:bg-neutral-800 transition-colors font-medium"
            >
              See how it works
            </a>
            <a
              href="#apply"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-neutral-300 text-neutral-900 rounded-full hover:bg-white transition-colors font-medium"
            >
              Apply now
            </a>
          </div>
        </div>
      </div>

      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto text-center md:text-left">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">
              Your short link
            </h2>
            <p className="text-neutral-600 leading-relaxed">
              Approved partners get a clean bio URL like{" "}
              <span className="text-neutral-900 font-medium">voronyz.com/yourname</span>{" "}
              that auto-applies your code.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">
              Audience discount
            </h2>
            <p className="text-neutral-600 leading-relaxed">
              Followers check out with your code. You keep a clear offer that matches
              how you promote.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">
              Direct with Voronyz
            </h2>
            <p className="text-neutral-600 leading-relaxed">
              Apply on this site. We review in-house and set you up — no third-party
              affiliate marketplace required.
            </p>
          </div>
        </div>
      </div>

      <AffiliatesClient />

      <div className="bg-black text-white py-16">
        <div className="container text-center">
          <h2 className="text-2xl font-bold mb-4">Questions before you apply?</h2>
          <p className="text-neutral-300 mb-6 max-w-xl mx-auto">
            Reach out anytime — or submit the form and we&apos;ll follow up after review.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black rounded-full hover:bg-neutral-100 transition-colors font-medium"
          >
            Contact Voronyz
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
