"use client";
import { Variant } from "@prisma/client";
import { useMemo, useState, useEffect } from "react";
import { formatCentsAsCurrency } from "@/lib/money";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

type Props = {
  variants: Variant[];
  productName?: string;
  coverImage?: string;
  productSlug?: string;
};

type VariantAttributes = {
  size?: number | string;
  color?: string;
};

interface CartItem {
  id: string;
  productName?: string;
  image?: string;
  variantId: string;
  quantity: number;
  priceCents: number;
  variant: { name: string };
  attributes?: { size?: number | string; color?: string; resolution?: 'normal' | 'high' };
  productSlug?: string;
}

interface CartData {
  items: CartItem[];
  discountCode?: string | null;
}

export default function AddToCart({ variants, productName, coverImage, productSlug }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const searchParams = useSearchParams();

  const allSizes = useMemo(() => {
    const values = new Set<(number | string) | undefined>();
    variants.forEach((v) => {
      const size = (v.attributes as VariantAttributes)?.size;
      if (size !== undefined) values.add(size);
    });
    return Array.from(values).sort((a, b) => Number(a) - Number(b)).filter((v): v is number | string => v !== undefined);
  }, [variants]);

  const allColors = useMemo(() => {
    const values = new Set<string | undefined>();
    variants.forEach((v) => {
      const color = (v.attributes as VariantAttributes)?.color;
      if (color) values.add(String(color).toLowerCase());
    });
    return Array.from(values).filter((v): v is string => !!v);
  }, [variants]);

  const [selectedSize, setSelectedSize] = useState<number | string | undefined>(
    () => {
      const sizeParam = searchParams.get('size');
      if (sizeParam && allSizes.includes(Number(sizeParam))) {
        return Number(sizeParam);
      }
      return allSizes[0];
    }
  );
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    () => {
      const colorParam = searchParams.get('color');
      if (colorParam && allColors.includes(colorParam.toLowerCase())) {
        return colorParam.toLowerCase();
      }
      return allColors[0];
    }
  );

  const [selectedResolution, setSelectedResolution] = useState<'normal' | 'high'>('normal');
  const [showResolutionPopup, setShowResolutionPopup] = useState(false);

  const selectedVariant = useMemo(() => {
    // Prefer exact match by size/color; fall back to first
    const byAttrs = variants.find((v) => {
      const attrs = (v.attributes as VariantAttributes) || {};
      const sizeMatch = selectedSize === undefined || attrs.size == selectedSize;
      const colorMatch = selectedColor === undefined || String(attrs.color).toLowerCase() === String(selectedColor).toLowerCase();
      return sizeMatch && colorMatch;
    });
    return byAttrs ?? variants[0];
  }, [variants, selectedSize, selectedColor]);

  const priceCents = selectedVariant.priceCents || 0;
  const effectivePrice = priceCents + (selectedResolution === 'high' ? 500 : 0);
  const totalCents = effectivePrice * quantity;
  const formattedTotal = formatCentsAsCurrency(totalCents);

  // Reset added state if selections change
  useEffect(() => {
    if (added) {
      setAdded(false);
    }
  }, [selectedSize, selectedColor, quantity, selectedResolution, added]);

  function add() {
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
          fullCart = { items: parsed, discountCode: null };
        } else {
          fullCart = parsed as CartData;
        }
      } else {
        fullCart = { items: [], discountCode: null };
      }

      const cart = fullCart.items; // Extract items array

      // Ensure selected variant exists
      if (!selectedVariant) {
        throw new Error("Variant not found");
      }

      const isDiscountActive = fullCart.discountCode === 'fam45';
      const resolution = selectedResolution;
      const baseDiscountPrice = 4500;
      const highDiscountPrice = 5000;
      const baseOriginalPrice = effectivePrice;

      // Check if item already exists in cart
      const existingItemIndex = cart.findIndex(item => item.variantId === selectedVariant.id && 
        item.attributes?.size === selectedSize && 
        item.attributes?.color === selectedColor && 
        item.attributes?.resolution === resolution);

      if (existingItemIndex >= 0) {
        // Update existing item
        const existingItem = cart[existingItemIndex];
        let newPrice = existingItem.priceCents;
        if (isDiscountActive) {
          newPrice = resolution === 'high' ? highDiscountPrice : baseDiscountPrice;
        } else {
          newPrice = baseOriginalPrice;
        }
        cart[existingItemIndex] = { 
          ...existingItem, 
          quantity: existingItem.quantity + quantity,
          priceCents: newPrice 
        };
      } else {
        // Add new item
        const newPrice = isDiscountActive ? (resolution === 'high' ? highDiscountPrice : baseDiscountPrice) : baseOriginalPrice;
        const newItem: CartItem = {
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          productName: productName,
          image: coverImage,
          variantId: selectedVariant.id,
          quantity,
          priceCents: newPrice,
          variant: { name: selectedVariant.name || "Default" },
          attributes: { 
            size: selectedSize, 
            color: selectedColor,
            resolution
          },
          productSlug,
        };
        cart.push(newItem);
      }

      // Update full cart and save
      fullCart.items = cart;
      localStorage.setItem("cart", JSON.stringify(fullCart));
      setAdded(true);
      setTimeout(() => setAdded(false), 3000);
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

        .glow {
          animation: glow 2s ease-in-out infinite;
        }
      `}</style>
      <div className="space-y-4">
        {(allSizes.length > 0) && (
          <div className="grid gap-2">
            <label className="text-sm text-neutral-700">Select Size</label>
            <div className="flex flex-wrap gap-2">
              {allSizes.map((size) => (
                <button
                  key={`size-${size}`}
                  onClick={() => setSelectedSize(size)}
                  className={`rounded-full px-4 py-2 text-sm text-neutral-900 ring-1 transition ${selectedSize === size ? "bg-black text-white ring-black glow" : "ring-black/10 hover:bg-black/5"}`}
                >
                  {String(size)}
                </button>
              ))}
            </div>
          </div>
        )}

        {(allColors.length > 0) && (
          <div className="grid gap-2">
            <label className="text-sm text-neutral-700">Select Color</label>
            <div className="flex flex-wrap gap-2">
              {allColors.map((color) => {
                const isSelected = selectedColor === color;
                const swatchBorder = isSelected ? 'border-white' : 'border-black/20';
                return (
                  <button
                    key={`color-${color}`}
                    onClick={() => setSelectedColor(color)}
                    title={color}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm text-neutral-900 ring-1 transition relative overflow-hidden ${isSelected ? "bg-black text-white ring-black glow" : "ring-black/10 hover:bg-black/5"}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full border ${swatchBorder}`}
                      style={{ backgroundColor: color }}
                    />
                    <span className={`capitalize ${isSelected ? 'text-white' : 'text-neutral-900'}`}>{color}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div className="grid gap-2">
          <div className="flex items-center gap-2">
            <label className="text-sm text-neutral-700">Select Resolution</label>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowResolutionPopup(true);
              }}
              className="text-xs font-bold text-neutral-500 hover:text-black rounded-full w-5 h-5 flex items-center justify-center border border-neutral-300 hover:border-neutral-500"
              title="See difference"
            >
              ?
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['normal', 'high'] as const).map((res) => (
              <button
                key={`res-${res}`}
                onClick={() => setSelectedResolution(res)}
                className={`rounded-full px-4 py-2 text-sm text-neutral-900 ring-1 transition ${selectedResolution === res ? "bg-black text-white ring-black glow" : "ring-black/10 hover:bg-black/5"}`}
              >
                {res === 'normal' ? 'Normal' : 'High Quality'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            className="w-20 h-[48px] rounded-md border border-black/10 px-3 py-2 text-sm text-neutral-900"
          />
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-xl font-bold text-green-600">{formattedTotal}</span>
          </div>
          <button 
            onClick={add} 
            disabled={loading || added} 
            className={`rounded-full px-6 py-3 text-sm font-medium h-[48px] flex-1 transition-colors ${
              loading 
                ? "bg-neutral-300 text-neutral-500 cursor-not-allowed" 
                : added 
                  ? "bg-green-600 text-white hover:bg-green-700" 
                  : "bg-black text-white hover:bg-neutral-800"
            } flex items-center justify-center gap-2`}
          >
            {loading ? (
              "Adding…"
            ) : added ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Added to Cart
              </>
            ) : (
              "Add to Cart"
            )}
          </button>
        </div>
      </div>
      {showResolutionPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-neutral-900">High Resolution Upgrade</h3>
                <button
                  onClick={() => setShowResolutionPopup(false)}
                  className="text-neutral-500 hover:text-neutral-900 text-xl font-bold rounded-full w-8 h-8 flex items-center justify-center hover:bg-neutral-100 transition-colors"
                >
                  ×
                </button>
              </div>
              <div className="text-center">
                <div className="relative border border-neutral-200 rounded-lg p-4 bg-neutral-50 mx-auto max-w-sm">
                  <Image 
                    src="/resolution-high.png" 
                    alt="High Quality Resolution" 
                    fill 
                    className="max-w-full h-64 object-cover rounded-md shadow-md mb-3"
                    sizes="(max-width: 640px) 100vw, 640px"
                  />
                </div>
                <p className="text-sm text-neutral-700 font-medium mb-2">High Quality Resolution</p>
                <p className="text-xs text-neutral-500">Finer details and smoother finish compared to normal resolution, for a premium look and feel. The upgrade adds $5 to enhance the print precision.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


