"use client";
import { useMemo, useState, useEffect } from "react";
import { formatCentsAsCurrency } from "@/lib/money";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { normalizeStudentName } from "@/lib/magikidShoesThumbnail";

interface VariantProps {
  id: string;
  color: string;
  stock: number;
  sku: string;
  priceCents: number | null;
}

type FulfillmentOption = {
  id: string;
  label: string;
  priceCents: number;
  description?: string;
};

type CarryStyleOption = {
  id: string;
  label: string;
  description: string;
  image: string;
};

type FlavorOption = {
  id: string;
  label: string;
  description?: string;
};

type Props = {
  variants: VariantProps[];
  primaryColors: string[];
  secondaryColors?: string[];
  sizes: string[];
  /** Used when variant.priceCents is null (same price for all colors). */
  productPriceCents?: number;
  productName?: string;
  coverImage?: string;
  productSlug?: string;
  secondaryLabel?: string;
  promoHint?: { code: string; promoPrice: number };
  fulfillmentOptions?: FulfillmentOption[];
  defaultGender?: "men" | "women" | "kids";
  requireStudentName?: boolean;
  /** Skip footwear size/gender UI (e.g. accessories with One Size). */
  hideSizeSelector?: boolean;
  /** Use the product `sizes` list directly (apparel XS–XXL) instead of footwear gender sizes. */
  useCatalogSizes?: boolean;
  /** Replace size UI with carry-style options (OWB / IWB). */
  carryStyles?: CarryStyleOption[];
  selectedCarryStyleId?: string;
  onCarryStyleChange?: (id: string) => void;
  /** Replace color swatches with flavor choices (e.g. trail mix). */
  flavorOptions?: FlavorOption[];
  soldOut?: boolean;
  /** Label when soldOut (e.g. "Sold Out"). Defaults to "Sold Out". */
  soldOutLabel?: string;
  /**
   * Coming-soon waitlist: customer can configure + pay now; we ship later.
   * Distinct from soldOut (which blocks purchase).
   */
  preOrder?: boolean;
};

const MENS_SIZES = ["6", "7", "8", "9", "10", "11", "12", "13"];
const WOMENS_SIZES = ["4", "5", "6", "7", "8", "9", "10", "11"];
const KIDS_SIZES = ["1", "2", "3", "4", "5", "6", "7"];

function sizesForGender(gender: "men" | "women" | "kids") {
  if (gender === "women") return WOMENS_SIZES;
  if (gender === "kids") return KIDS_SIZES;
  return MENS_SIZES;
}

function parseGenderParam(value: string | null): "men" | "women" | "kids" | null {
  if (value === "men" || value === "women" || value === "kids") return value;
  return null;
}

interface CartItem {
  id: string;
  productName?: string;
  image?: string;
  variantId: string;
  quantity: number;
  priceCents: number;
  variant: { name: string };
  attributes?: { color?: string; size?: string; fulfillment?: string; gender?: string };
  productSlug?: string;
  studentName?: string;
  message?: string;
  /** Pay-now waitlist item — ships when the product arrives. */
  isPreOrder?: boolean;
}

interface CartData {
  items: CartItem[];
  discountCode?: string | null;
}

export default function AddToCart({ 
  variants, 
  primaryColors, 
  secondaryColors = [], 
  sizes, 
  productPriceCents,
  productName, 
  coverImage, 
  productSlug,
  secondaryLabel,
  fulfillmentOptions = [],
  defaultGender = "men",
  requireStudentName = false,
  hideSizeSelector = false,
  useCatalogSizes = false,
  carryStyles = [],
  selectedCarryStyleId,
  onCarryStyleChange,
  flavorOptions = [],
  soldOut = false,
  soldOutLabel = "Sold Out",
  preOrder = false,
}: Props) {
  const hasSecondaryColors = secondaryColors.length > 0;
  const hasFulfillmentOptions = fulfillmentOptions.length > 0;
  const hasCarryStyles = carryStyles.length > 0;
  const hasFlavorOptions = flavorOptions.length > 0;
  const oneSizeLabel = sizes[0] || "One Size";
  const catalogSizes = useMemo(
    () => (sizes.length > 0 ? sizes : ["S", "M", "L", "XL"]),
    [sizes]
  );
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const searchParams = useSearchParams();

  const [selectedPrimary, setSelectedPrimary] = useState<string | undefined>(
    () => {
      const primaryParam = searchParams.get('primary');
      if (primaryParam && primaryColors.includes(primaryParam.toLowerCase())) {
        return primaryParam.toLowerCase();
      }
      return primaryColors[0];
    }
  );

  const [selectedSecondary, setSelectedSecondary] = useState<string | undefined>(
    () => {
      if (!hasSecondaryColors) return undefined;
      const secondaryParam = searchParams.get('secondary');
      if (secondaryParam && secondaryColors.includes(secondaryParam.toLowerCase())) {
        return secondaryParam.toLowerCase();
      }
      return secondaryColors[0];
    }
  );

  const [selectedFulfillment, setSelectedFulfillment] = useState<string>(
    () => fulfillmentOptions[0]?.id ?? "shipping"
  );

  const [gender, setGender] = useState<"men" | "women" | "kids">(() => {
    return parseGenderParam(searchParams.get("gender")) ?? defaultGender;
  });

  const [selectedSize, setSelectedSize] = useState<string | undefined>(() => {
    if (hasCarryStyles) {
      const sizeParam = searchParams.get("size");
      if (sizeParam && carryStyles.some((style) => style.id === sizeParam)) {
        return sizeParam;
      }
      return selectedCarryStyleId || carryStyles[0]?.id || oneSizeLabel;
    }
    if (hideSizeSelector) return oneSizeLabel;
    const sizeParam = searchParams.get("size");
    if (useCatalogSizes) {
      if (sizeParam && catalogSizes.includes(sizeParam)) return sizeParam;
      return catalogSizes[0];
    }
    const initialGender = parseGenderParam(searchParams.get("gender")) ?? defaultGender;
    const initialSizes = sizesForGender(initialGender);
    if (sizeParam && initialSizes.includes(sizeParam)) {
      return sizeParam;
    }
    return initialSizes[0];
  });

  const activeCarryStyleId = selectedCarryStyleId || selectedSize;
  const resolvedCoverImage =
    carryStyles.find((style) => style.id === activeCarryStyleId)?.image || coverImage;

  const [studentName, setStudentName] = useState("");
  const normalizedStudentName = requireStudentName ? normalizeStudentName(studentName) : null;

  // Get stock for a primary color
  const getStockForPrimary = (color: string) => {
    const variant = variants.find(v => v.color === color);
    return variant ? variant.stock : 999;
  };

  // Check if primary is available
  const isPrimaryAvailable = (color: string) => {
    // Coming soon / sold-out catalog items stay browsable like regular products.
    // Pre-order items also stay selectable even though variant stock is 0.
    if (soldOut || preOrder) return true;
    const stock = getStockForPrimary(color);
    return stock > 0;
  };

  const selectedVariant = useMemo(() => {
    if (!selectedPrimary) return null;
    return variants.find(v => v.color === selectedPrimary);
  }, [variants, selectedPrimary]);

  const selectedFulfillmentOption = useMemo(
    () => fulfillmentOptions.find((o) => o.id === selectedFulfillment) ?? fulfillmentOptions[0],
    [fulfillmentOptions, selectedFulfillment]
  );

  const priceCents = hasFulfillmentOptions
    ? (selectedFulfillmentOption?.priceCents ?? productPriceCents ?? 7500)
    : (selectedVariant?.priceCents ?? productPriceCents ?? 7500);
  const totalCents = priceCents * quantity;
  const formattedTotal = formatCentsAsCurrency(totalCents);

  // Disable add if no selections or primary out of stock (pre-orders stay allowed)
  const canAdd =
    !soldOut &&
    selectedPrimary &&
    (selectedSecondary || !hasSecondaryColors) &&
    selectedSize &&
    isPrimaryAvailable(selectedPrimary) &&
    (!requireStudentName || Boolean(normalizedStudentName));

  // Get display sizes based on gender
  const displaySizes = useMemo(
    () => (useCatalogSizes ? catalogSizes : sizesForGender(gender)),
    [useCatalogSizes, catalogSizes, gender]
  );

  // Get size label based on gender
  const sizeLabel = useCatalogSizes
    ? "Size"
    : gender === "men"
      ? "Men's"
      : gender === "women"
        ? "Women's"
        : "Kids'";

  // Keep controlled carry-style selection in sync with the parent gallery.
  useEffect(() => {
    if (!hasCarryStyles) return;
    if (selectedCarryStyleId && selectedCarryStyleId !== selectedSize) {
      setSelectedSize(selectedCarryStyleId);
    }
  }, [hasCarryStyles, selectedCarryStyleId, selectedSize]);

  // Reset selected size when gender changes if current size is not in new array
  useEffect(() => {
    if (hideSizeSelector || hasCarryStyles) return;
    if (selectedSize && !displaySizes.includes(selectedSize)) {
      setSelectedSize(displaySizes[0]);
    }
  }, [gender, displaySizes, selectedSize, hideSizeSelector, hasCarryStyles]);

  // Reset added if selections change
  useEffect(() => {
    setAdded(false);
  }, [selectedPrimary, selectedSecondary, selectedSize, gender, selectedFulfillment, studentName]);

  function selectCarryStyle(id: string) {
    setSelectedSize(id);
    onCarryStyleChange?.(id);
  }

  // Human-readable color names for hex values
  const colorDisplayName = (color: string) => {
    const names: Record<string, string> = {
      "#007FFF": "Azure Blue",
      "#007fff": "Azure Blue",
      "#C6FF00": "Neon Green",
      "#c6ff00": "Neon Green",
      "wild-berry": "Wild Berry",
      "super-protein": "Super Protein",
      chocolate: "Chocolate",
    };
    return names[color] || color;
  };

  function add() {
    if (!canAdd) return;

    setLoading(true);
    setAdded(false);

    try {
      // Load full cart from localStorage
      const cartDataStr = localStorage.getItem("cart");
      let fullCart: CartData;
      if (cartDataStr) {
        const parsed = JSON.parse(cartDataStr);
        if (Array.isArray(parsed)) {
          // Legacy array format, migrate
          fullCart = { items: parsed.map((item: unknown) => ({ 
            ...(item as CartItem), 
            message: '' 
          })), discountCode: null };
        } else {
          fullCart = parsed as CartData;
        }
      } else {
        fullCart = { items: [], discountCode: null };
      }

      const cart = fullCart.items;

      if (!selectedVariant) {
        throw new Error("Variant not found");
      }

      // Check if item already exists (match variantId + attributes)
      const existingItemIndex = cart.findIndex(item => 
        item.variantId === selectedVariant.id && 
        Boolean(item.isPreOrder) === Boolean(preOrder) &&
        (hasSecondaryColors ? item.attributes?.color === selectedSecondary : !item.attributes?.color) && 
        item.attributes?.size === selectedSize &&
        ((hideSizeSelector || hasCarryStyles || useCatalogSizes) ? true : item.attributes?.gender === gender) &&
        (hasFulfillmentOptions ? item.attributes?.fulfillment === selectedFulfillment : !item.attributes?.fulfillment) &&
        (requireStudentName ? item.studentName === normalizedStudentName : !item.studentName)
      );

      if (existingItemIndex >= 0) {
        // Update existing
        const existingItem = cart[existingItemIndex];
        cart[existingItemIndex] = { 
          ...existingItem, 
          quantity: existingItem.quantity + quantity,
          priceCents: priceCents,
          image: resolvedCoverImage,
          message: existingItem.message || ''
        };
      } else {
        // Add new
        const newItem: CartItem = {
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          productName,
          image: resolvedCoverImage,
          variantId: selectedVariant.id,
          quantity,
          priceCents,
          variant: { name: selectedPrimary },
          attributes: { 
            ...(selectedSecondary && { color: selectedSecondary }), 
            size: selectedSize,
            ...(!hideSizeSelector && !hasCarryStyles && !useCatalogSizes && { gender }),
            ...(hasFulfillmentOptions && { fulfillment: selectedFulfillment }),
          },
          productSlug,
          ...(normalizedStudentName && { studentName: normalizedStudentName }),
          ...(preOrder && { isPreOrder: true }),
          message: ''
        };
        cart.push(newItem);
      }

      // Update full cart and save
      fullCart.items = cart;
      localStorage.setItem("cart", JSON.stringify(fullCart));
      // Dispatch event to update cart count in header
      window.dispatchEvent(new Event('cartUpdated'));
      setAdded(true);
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(0, 0, 0, 0.2), 0 0 10px rgba(0, 0, 0, 0.1);
          }
          50% {
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.4), 0 0 30px rgba(0, 0, 0, 0.2);
          }
        }

        @keyframes slideLeftAndShrink {
          0% {
            width: 100%;
            transform: translateX(0);
            background-color: rgb(0, 0, 0);
          }
          50% {
            width: 48px;
            transform: translateX(0);
            background-color: rgb(11, 102, 37);
          }
          100% {
            width: 48px;
            transform: translateX(0);
            background-color: rgb(22, 163, 74);
          }
        }

        @keyframes popInFromRight {
          0% {
            opacity: 0;
            transform: translateX(40px) scale(0.6);
          }
          60% {
            opacity: 1;
            transform: translateX(-3px) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes textQuickFade {
          0% {
            opacity: 0;
          }
          90% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        .glow {
          animation: glow 2s ease-in-out infinite;
        }

        .button-container {
          position: relative;
          min-height: 48px;
          overflow: visible;
        }

        .button-split-wrapper {
          display: flex;
          gap: 8px;
          width: 100%;
        }

        .button-slide-left {
          animation: slideLeftAndShrink 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          flex: 0 0 auto;
          min-width: 0;
        }

        .button-slide-left {
          animation: slideLeftAndShrink 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          flex: 0 0 auto;
          min-width: 0;
        }

        .button-slide-left > * {
          animation: textQuickFade 0.55s ease-out forwards;
          opacity: 0;
        }

        .button-pop-right {
          animation: popInFromRight 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          animation-delay: 0.25s;
          opacity: 0;
          flex: 1;
          min-width: 0;
        }
      `}</style>
      <div className="space-y-4">
        {soldOut && (
          <div className="rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white">
            {soldOutLabel}
          </div>
        )}
        {preOrder && !soldOut && (
          <div className="rounded-2xl bg-neutral-900 px-4 py-3 space-y-1">
            <div className="text-sm font-semibold text-white">Pre-order — pay now, ship later</div>
            <p className="text-xs leading-relaxed text-white/75">
              Join the waitlist with a paid reservation. We&apos;ll make and ship your piece when this drop arrives — that could be a day or much longer.
            </p>
          </div>
        )}

        {/* Flavor options (trail mix) */}
        {hasFlavorOptions ? (
          <div className="grid gap-2">
            <label className="text-sm text-neutral-700">Flavor</label>
            <div className="grid gap-2">
              {flavorOptions.map((flavor) => {
                const isSelected = selectedPrimary === flavor.id;
                const available = isPrimaryAvailable(flavor.id);
                return (
                  <button
                    key={flavor.id}
                    type="button"
                    onClick={() => available && setSelectedPrimary(flavor.id)}
                    disabled={!available || soldOut}
                    className={`flex flex-col items-start rounded-2xl px-4 py-3 text-left ring-1 transition ${
                      isSelected
                        ? "bg-black text-white ring-black"
                        : available
                          ? "bg-white text-neutral-900 ring-black/10 hover:bg-black/5"
                          : "bg-neutral-50 text-neutral-400 ring-neutral-200 cursor-not-allowed"
                    }`}
                  >
                    <span className="text-sm font-semibold tracking-wide">
                      {flavor.label}
                      {!available || soldOut ? ` — ${soldOutLabel}` : ""}
                    </span>
                    {flavor.description && (
                      <span className={`text-xs mt-0.5 ${isSelected ? "text-white/80" : "text-neutral-500"}`}>
                        {flavor.description}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
        /* Primary Color */
        <div className="grid gap-2">
          <label className="text-sm text-neutral-700">Primary Color</label>
          <div className="flex flex-wrap gap-2">
            {primaryColors.map((color) => {
              const isSelected = selectedPrimary === color;
              const available = isPrimaryAvailable(color);
              return (
                <button
                  key={`primary-${color}`}
                  onClick={() => available && setSelectedPrimary(color)}
                  disabled={!available}
                  className={`flex items-center gap-0 rounded-full px-2 py-2 text-sm transition-all leading-none ${
                    isSelected 
                      ? "bg-black text-white ring-black glow" 
                      : available 
                        ? "ring-black/10 hover:bg-black/5 text-neutral-900" 
                        : "bg-red-50 text-red-600 ring-red-300 cursor-not-allowed opacity-50"
                  } ring-1`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full mr-2 border flex-shrink-0 ${
                    isSelected ? 'border-white' : 'border-black/20'
                  }`} style={{ backgroundColor: color }} />
                  <span className="capitalize">
                    {colorDisplayName(color)}
                    {!available && " (Out of Stock)"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        )}

        {/* Secondary / Lace Color — only shown when product has secondary colors */}
        {hasSecondaryColors && (
          <div className="grid gap-2">
            <label className="text-sm text-neutral-700">{secondaryLabel || "Secondary Color"}</label>
            <div className="flex flex-wrap gap-2">
              {secondaryColors.map((color) => {
                const isSelected = selectedSecondary === color;
                return (
                  <button
                    key={`secondary-${color}`}
                    onClick={() => setSelectedSecondary(color)}
                    className={`flex items-center gap-0 rounded-full px-2 py-2 text-sm text-neutral-900 ring-1 transition leading-none ${
                      isSelected 
                        ? "bg-black text-white ring-black glow" 
                        : "ring-black/10 hover:bg-black/5"
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full mr-2 border flex-shrink-0 ${
                      isSelected ? 'border-white' : 'border-black/20'
                    }`} style={{ backgroundColor: color }} />
                    <span className="capitalize">{color}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Fulfillment (shipping vs pickup) */}
        {hasFulfillmentOptions && (
          <div className="grid gap-2">
            <label className="text-sm text-neutral-700">Delivery</label>
            <div className="flex flex-col gap-2">
              {fulfillmentOptions.map((option) => {
                const isSelected = selectedFulfillment === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedFulfillment(option.id)}
                    className={`flex flex-col items-start rounded-xl px-4 py-3 text-left ring-1 transition ${
                      isSelected
                        ? "bg-black text-white ring-black"
                        : "bg-white text-neutral-900 ring-black/10 hover:bg-black/5"
                    }`}
                  >
                    <span className="text-sm font-medium">{option.label}</span>
                    {option.description && (
                      <span className={`text-xs mt-0.5 ${isSelected ? "text-white/80" : "text-neutral-500"}`}>
                        {option.description}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Carry style (OWB / IWB) */}
        {hasCarryStyles && (
          <div className="grid gap-2">
            <label className="text-sm text-neutral-700">Glock 43x</label>
            <div className="grid gap-2">
              {carryStyles.map((style) => {
                const isSelected = activeCarryStyleId === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => selectCarryStyle(style.id)}
                    className={`flex flex-col items-start rounded-2xl px-4 py-3 text-left ring-1 transition ${
                      isSelected
                        ? "bg-black text-white ring-black"
                        : "bg-white text-neutral-900 ring-black/10 hover:bg-black/5"
                    }`}
                  >
                    <span className="text-sm font-semibold tracking-wide">{style.label}</span>
                    <span className={`text-xs mt-0.5 ${isSelected ? "text-white/80" : "text-neutral-500"}`}>
                      {style.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Size */}
        {!hideSizeSelector && !hasCarryStyles && (
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-neutral-700">
              {useCatalogSizes ? "Size" : `Size (US ${sizeLabel})`}
            </label>
            {!useCatalogSizes && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setGender("men")}
                className={`text-xs px-2 py-1 rounded-full transition ${
                  gender === "men"
                    ? "bg-black text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                Men&apos;s
              </button>
              <button
                onClick={() => setGender("women")}
                className={`text-xs px-2 py-1 rounded-full transition ${
                  gender === "women"
                    ? "bg-black text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                Women&apos;s
              </button>
              <button
                onClick={() => setGender("kids")}
                className={`text-xs px-2 py-1 rounded-full transition ${
                  gender === "kids"
                    ? "bg-black text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                Kids&apos;
              </button>
            </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {displaySizes.map((displaySize) => {
              const isSelected = selectedSize === displaySize;
              return (
                <button
                  key={`size-${displaySize}-${useCatalogSizes ? "catalog" : gender}`}
                  onClick={() => {
                    setSelectedSize(displaySize);
                  }}
                  className={`rounded-full h-10 w-10 text-sm text-neutral-900 ring-1 transition flex items-center justify-center ${
                    isSelected 
                      ? "bg-black text-white ring-black glow" 
                      : "ring-black/10 hover:bg-black/5"
                  }`}
                >
                  {displaySize}
                </button>
              );
            })}
          </div>
        </div>
        )}

        {requireStudentName && (
          <div className="grid gap-2">
            <label htmlFor="student-name" className="text-sm text-neutral-700">
              Student name <span className="text-red-600">*</span>
            </label>
            <input
              id="student-name"
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Enter the student's full name"
              autoComplete="name"
              maxLength={80}
              className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black/10"
            />
            <p className="text-xs text-neutral-500">
              Required so we can match each pair to the right student.
            </p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            className="w-20 h-[48px] rounded-md border border-black/10 px-3 py-2 text-sm text-neutral-900"
          />
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-2xl font-bold text-neutral-900">{formattedTotal}</span>
          </div>
          <div className="button-container flex-1">
            {added ? (
              <div className="button-split-wrapper">
                <button 
                  disabled
                  aria-label="Added to cart"
                  className="button-slide-left rounded-full h-[48px] w-[48px] bg-green-600 text-white flex items-center justify-center"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <Link
                  href="/cart"
                  className="button-pop-right rounded-full px-6 py-3 text-sm font-medium h-[48px] flex-1 bg-black text-white hover:bg-neutral-800 flex items-center justify-center transition-colors"
                >
                  View Cart
                </Link>
              </div>
            ) : (
              <button 
                onClick={add} 
                disabled={loading || !canAdd} 
                className={`rounded-full px-6 py-3 text-sm font-medium h-[48px] w-full transition-all duration-300 ease-out ${
                  loading || !canAdd
                    ? "bg-neutral-300 text-neutral-500 cursor-not-allowed" 
                    : "bg-black text-white hover:bg-neutral-800"
                } flex items-center justify-center gap-2`}
              >
                {loading
                  ? "Adding…"
                  : soldOut
                    ? soldOutLabel
                    : preOrder
                      ? "Pre-order — Pay now"
                      : "Add to Cart"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}


