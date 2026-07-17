"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatCentsAsCurrency } from "@/lib/money";
import {
  QUIZ_QUESTIONS,
  type QuizAnswers,
  type QuizProfileId,
} from "@/lib/quiz";
import {
  clearQuizSession,
  loadQuizSession,
  saveQuizSession,
} from "@/lib/quizSession";

type QuizResultProfile = {
  id: QuizProfileId;
  title: string;
  summary: string;
  why: string;
};

type QuizProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  thumbnail: string;
  primaryColors: string[];
  sizes: string[];
  variants: Array<{
    id: string;
    color: string;
    stock: number;
    sku: string;
    priceCents: number | null;
  }>;
};

type CartItem = {
  id: string;
  productName?: string;
  image?: string;
  variantId: string;
  quantity: number;
  priceCents: number;
  variant: { name: string };
  attributes?: { color?: string; size?: string; gender?: string };
  productSlug?: string;
};

type CartData = {
  items: CartItem[];
  discountCode?: string | null;
};

function loadCart(): CartData {
  try {
    const raw = localStorage.getItem("cart");
    if (!raw) return { items: [], discountCode: null };
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return { items: parsed, discountCode: null };
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      discountCode: parsed.discountCode ?? null,
    };
  } catch {
    return { items: [], discountCode: null };
  }
}

function saveCart(cart: CartData) {
  localStorage.setItem("cart", JSON.stringify(cart));
  window.dispatchEvent(new Event("cartUpdated"));
}

function colorLabel(color: string) {
  if (color === "#007FFF" || color === "#007fff") return "Azure Blue";
  return color.charAt(0).toUpperCase() + color.slice(1);
}

function defaultSizeForProduct(slug: string, sizes: string[]): string {
  if (slug === "magikid-shoes") return sizes.includes("3") ? "3" : sizes[0] || "3";
  return sizes.includes("9") ? "9" : sizes[0] || "9";
}

function inStockVariants(product: QuizProduct) {
  return product.variants.filter((v) => v.stock > 0);
}

export default function QuizClient() {
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [profile, setProfile] = useState<QuizResultProfile | null>(null);
  const [recommendedSlugs, setRecommendedSlugs] = useState<string[]>([]);
  const [products, setProducts] = useState<QuizProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [selections, setSelections] = useState<
    Record<string, { color: string; size: string }>
  >({});
  const [addingSlug, setAddingSlug] = useState<string | null>(null);
  const [addedSlugs, setAddedSlugs] = useState<Record<string, boolean>>({});
  const [addingAll, setAddingAll] = useState(false);

  const totalSteps = QUIZ_QUESTIONS.length;
  const question = QUIZ_QUESTIONS[step];
  const progress = profile ? 100 : Math.round(((step + 1) / totalSteps) * 100);
  const selectedForStep = question ? answers[question.id] : undefined;
  const isLastQuestion = step === totalSteps - 1;

  const persistResults = useCallback(
    (
      next: {
        answers: QuizAnswers;
        profile: QuizResultProfile;
        recommendedSlugs: string[];
        selections?: Record<string, { color: string; size: string }>;
        addedSlugs?: Record<string, boolean>;
      }
    ) => {
      saveQuizSession({
        answers: next.answers,
        profile: next.profile,
        recommendedSlugs: next.recommendedSlugs,
        selections: next.selections,
        addedSlugs: next.addedSlugs,
      });
    },
    []
  );

  const loadProducts = useCallback(
    async (
      slugs: string[],
      options?: { preserveSelections?: Record<string, { color: string; size: string }> }
    ) => {
      if (slugs.length === 0) {
        setProducts([]);
        return;
      }
      setProductsLoading(true);
      setProductsError(null);
      try {
        const res = await fetch(
          `/api/quiz/products?slugs=${encodeURIComponent(slugs.join(","))}`
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Could not load recommended products");
        }
        const data = await res.json();
        const list = (data.products ?? []) as QuizProduct[];
        setProducts(list);

        const preserved = options?.preserveSelections;
        const nextSelections: Record<string, { color: string; size: string }> = {};
        for (const product of list) {
          const stocked = inStockVariants(product);
          const saved = preserved?.[product.slug];
          const color =
            (saved?.color && stocked.some((v) => v.color === saved.color)
              ? saved.color
              : null) ||
            stocked[0]?.color ||
            product.primaryColors[0] ||
            product.variants[0]?.color ||
            "black";
          nextSelections[product.slug] = {
            color,
            size:
              saved?.size ||
              defaultSizeForProduct(product.slug, product.sizes),
          };
        }
        setSelections(nextSelections);
      } catch (err) {
        setProductsError(
          err instanceof Error ? err.message : "Could not load products"
        );
      } finally {
        setProductsLoading(false);
      }
    },
    []
  );

  // Restore completed quiz results after navigating away (e.g. product → back).
  useEffect(() => {
    const saved = loadQuizSession();
    if (saved) {
      setAnswers(saved.answers);
      setProfile(saved.profile);
      setRecommendedSlugs(saved.recommendedSlugs);
      if (saved.selections) setSelections(saved.selections);
      if (saved.addedSlugs) setAddedSlugs(saved.addedSlugs);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || recommendedSlugs.length === 0) return;
    const saved = loadQuizSession();
    void loadProducts(recommendedSlugs, {
      preserveSelections: saved?.selections,
    });
  }, [ready, recommendedSlugs, loadProducts]);

  // Keep session in sync when shopper adjusts color/size or adds items.
  useEffect(() => {
    if (!ready || !profile || recommendedSlugs.length === 0) return;
    persistResults({
      answers,
      profile,
      recommendedSlugs,
      selections,
      addedSlugs,
    });
  }, [
    ready,
    answers,
    profile,
    recommendedSlugs,
    selections,
    addedSlugs,
    persistResults,
  ]);

  function pickOption(optionId: string) {
    if (!question) return;
    setAnswers((prev) => ({ ...prev, [question.id]: optionId }));
    setSubmitError(null);
  }

  async function submitQuiz(finalAnswers: QuizAnswers) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: finalAnswers }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not finish the quiz");
      }
      const nextProfile = data.profile as QuizResultProfile;
      const nextSlugs = (data.recommendedSlugs ?? []) as string[];
      setAnswers(finalAnswers);
      setProfile(nextProfile);
      setRecommendedSlugs(nextSlugs);
      setAddedSlugs({});
      persistResults({
        answers: finalAnswers,
        profile: nextProfile,
        recommendedSlugs: nextSlugs,
        selections: {},
        addedSlugs: {},
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not finish the quiz");
    } finally {
      setSubmitting(false);
    }
  }

  async function goNext() {
    if (!question || !selectedForStep) return;
    if (isLastQuestion) {
      await submitQuiz({ ...answers, [question.id]: selectedForStep });
      return;
    }
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  }

  function goBack() {
    if (profile) {
      clearQuizSession();
      setProfile(null);
      setRecommendedSlugs([]);
      setProducts([]);
      setAddedSlugs({});
      setSelections({});
      setStep(totalSteps - 1);
      return;
    }
    setStep((s) => Math.max(s - 1, 0));
  }

  function restart() {
    clearQuizSession();
    setStep(0);
    setAnswers({});
    setProfile(null);
    setRecommendedSlugs([]);
    setProducts([]);
    setSubmitError(null);
    setAddedSlugs({});
    setSelections({});
  }

  function addProductToCart(product: QuizProduct): boolean {
    const stocked = inStockVariants(product);
    if (stocked.length === 0) return false;

    const selection = selections[product.slug];
    const color =
      selection?.color && stocked.some((v) => v.color === selection.color)
        ? selection.color
        : stocked[0].color;
    const variant = stocked.find((v) => v.color === color) ?? stocked[0];
    const size =
      selection?.size || defaultSizeForProduct(product.slug, product.sizes);
    const priceCents = variant.priceCents ?? product.priceCents;
    const gender = product.slug === "magikid-shoes" ? "kids" : "men";

    const cart = loadCart();
    const existingIndex = cart.items.findIndex(
      (item) =>
        item.variantId === variant.id &&
        item.attributes?.size === size &&
        item.attributes?.gender === gender &&
        !item.attributes?.color
    );

    if (existingIndex >= 0) {
      cart.items[existingIndex] = {
        ...cart.items[existingIndex],
        quantity: cart.items[existingIndex].quantity + 1,
        priceCents,
        image: product.thumbnail,
      };
    } else {
      cart.items.push({
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        productName: product.name,
        image: product.thumbnail,
        variantId: variant.id,
        quantity: 1,
        priceCents,
        variant: { name: color },
        attributes: { size, gender },
        productSlug: product.slug,
      });
    }

    saveCart(cart);
    return true;
  }

  async function handleAddOne(product: QuizProduct) {
    setAddingSlug(product.slug);
    try {
      const ok = addProductToCart(product);
      if (ok) {
        setAddedSlugs((prev) => ({ ...prev, [product.slug]: true }));
      }
    } finally {
      window.setTimeout(() => setAddingSlug(null), 400);
    }
  }

  async function handleAddAll() {
    setAddingAll(true);
    try {
      const nextAdded = { ...addedSlugs };
      for (const product of products) {
        if (inStockVariants(product).length === 0) continue;
        if (addProductToCart(product)) {
          nextAdded[product.slug] = true;
        }
      }
      setAddedSlugs(nextAdded);
    } finally {
      setAddingAll(false);
    }
  }

  const canAddAny = useMemo(
    () => products.some((p) => inStockVariants(p).length > 0),
    [products]
  );

  if (!ready) {
    return (
      <div className="max-w-2xl mx-auto py-10 text-center text-neutral-500">
        Loading…
      </div>
    );
  }

  if (profile) {
    return (
      <div className="space-y-10 fade-in-up">
        <div className="max-w-2xl">
          <p className="uppercase tracking-[0.28em] text-xs text-neutral-500 mb-3">
            Your results
          </p>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900">
            {profile.title}
          </h2>
          <p className="mt-4 text-lg text-neutral-700 leading-relaxed">{profile.summary}</p>
          <p className="mt-3 text-sm text-neutral-500 leading-relaxed">{profile.why}</p>
          <p className="mt-6 rounded-2xl bg-neutral-900 text-white px-5 py-4 text-sm sm:text-base leading-relaxed">
            These are the products that match what you told us you need. Add them to
            your cart to get started — you can still pick colors and sizes on the product
            page if you want to fine-tune.
          </p>
        </div>

        {productsLoading ? (
          <p className="text-neutral-500">Loading your matches…</p>
        ) : null}
        {productsError ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
            {productsError}
          </p>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2">
          {products.map((product, index) => {
            const stocked = inStockVariants(product);
            const soldOut = stocked.length === 0;
            const selection = selections[product.slug];
            const added = Boolean(addedSlugs[product.slug]);

            return (
              <article
                key={product.id}
                className="group overflow-hidden rounded-3xl ring-1 ring-black/10 bg-white transition hover:ring-black/20"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <Link href={`/products/${product.slug}`} className="block relative aspect-[4/3] bg-neutral-100">
                  <Image
                    src={product.thumbnail}
                    alt={product.name}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </Link>
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900">
                        <Link href={`/products/${product.slug}`} className="hover:underline">
                          {product.name}
                        </Link>
                      </h3>
                      <p className="mt-1 text-sm text-neutral-600 line-clamp-2">
                        {product.description}
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold text-neutral-900">
                      {formatCentsAsCurrency(product.priceCents, product.currency)}
                    </p>
                  </div>

                  {!soldOut ? (
                    <div className="grid grid-cols-2 gap-3">
                      <label className="text-xs text-neutral-500 space-y-1">
                        <span className="block uppercase tracking-wider">Color</span>
                        <select
                          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-neutral-900"
                          value={selection?.color ?? stocked[0]?.color}
                          onChange={(e) =>
                            setSelections((prev) => ({
                              ...prev,
                              [product.slug]: {
                                color: e.target.value,
                                size:
                                  prev[product.slug]?.size ||
                                  defaultSizeForProduct(product.slug, product.sizes),
                              },
                            }))
                          }
                        >
                          {stocked.map((v) => (
                            <option key={v.id} value={v.color}>
                              {colorLabel(v.color)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-xs text-neutral-500 space-y-1">
                        <span className="block uppercase tracking-wider">Size</span>
                        <select
                          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-neutral-900"
                          value={
                            selection?.size ||
                            defaultSizeForProduct(product.slug, product.sizes)
                          }
                          onChange={(e) =>
                            setSelections((prev) => ({
                              ...prev,
                              [product.slug]: {
                                color:
                                  prev[product.slug]?.color ||
                                  stocked[0]?.color ||
                                  "black",
                                size: e.target.value,
                              },
                            }))
                          }
                        >
                          {(product.sizes.length > 0
                            ? product.sizes
                            : ["8", "9", "10", "11"]
                          ).map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-500">Currently unavailable</p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      disabled={soldOut || addingSlug === product.slug}
                      onClick={() => handleAddOne(product)}
                      className="flex-1"
                    >
                      {added
                        ? "Added ✓"
                        : addingSlug === product.slug
                          ? "Adding…"
                          : "Add to cart"}
                    </Button>
                    <Link
                      href={`/products/${product.slug}`}
                      className="inline-flex items-center justify-center rounded-full ring-1 ring-black/10 px-5 py-3 text-sm font-medium hover:bg-black/5"
                    >
                      Customize
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-2">
          <Button
            type="button"
            size="lg"
            disabled={!canAddAny || addingAll}
            onClick={handleAddAll}
            className="btn-shimmer"
          >
            {addingAll ? "Adding…" : "Add these products to cart"}
          </Button>
          <Link
            href="/cart"
            className="inline-flex items-center justify-center rounded-full bg-neutral-900 text-white px-6 py-3.5 text-base font-medium hover:bg-neutral-800"
          >
            View cart
          </Link>
          <Button type="button" variant="secondary" size="lg" onClick={restart}>
            Retake quiz
          </Button>
          <button
            type="button"
            onClick={goBack}
            className="text-sm text-neutral-500 hover:text-neutral-800 underline-offset-4 hover:underline px-2"
          >
            Back to last question
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-neutral-500 mb-2">
          <span>
            Question {step + 1} of {totalSteps}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-neutral-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-neutral-900 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {question ? (
        <div key={question.id} className="space-y-6 fade-in-up">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">
              {question.prompt}
            </h2>
            {question.helper ? (
              <p className="mt-2 text-neutral-600">{question.helper}</p>
            ) : null}
          </div>

          <div className="grid gap-3" role="radiogroup" aria-label={question.prompt}>
            {question.options.map((option) => {
              const selected = selectedForStep === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => pickOption(option.id)}
                  className={`text-left rounded-2xl px-5 py-4 transition ring-1 ${
                    selected
                      ? "bg-neutral-900 text-white ring-neutral-900 shadow-lg scale-[1.01]"
                      : "bg-white text-neutral-900 ring-black/10 hover:ring-black/25 hover:bg-neutral-50"
                  }`}
                >
                  <span className="block font-medium">{option.label}</span>
                  {option.hint ? (
                    <span
                      className={`block mt-1 text-sm ${
                        selected ? "text-white/70" : "text-neutral-500"
                      }`}
                    >
                      {option.hint}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {submitError ? (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
              {submitError}
            </p>
          ) : null}

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0 || submitting}
              className="text-sm text-neutral-500 hover:text-neutral-800 disabled:opacity-40"
            >
              Back
            </button>
            <Button
              type="button"
              size="lg"
              disabled={!selectedForStep || submitting}
              onClick={goNext}
            >
              {submitting
                ? "Getting your matches…"
                : isLastQuestion
                  ? "See my results"
                  : "Next"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
