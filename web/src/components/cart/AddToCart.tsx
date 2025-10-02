"use client";
import { useMemo, useState, useEffect } from "react";
import { formatCentsAsCurrency } from "@/lib/money";
import { useSearchParams } from "next/navigation";

interface VariantProps {
  id: string;
  color: string;
  stock: number;
  sku: string;
  priceCents: number | null;
}

type Props = {
  variants: VariantProps[];
  primaryColors: string[];
  secondaryColors: string[];
  sizes: string[];
  productName?: string;
  coverImage?: string;
  productSlug?: string;
};

interface CartItem {
  id: string;
  productName?: string;
  image?: string;
  variantId: string;
  quantity: number;
  priceCents: number;
  variant: { name: string };
  attributes?: { color?: string; size?: string; resolution?: 'normal' | 'high' };
  productSlug?: string;
}

interface CartData {
  items: CartItem[];
  discountCode?: string | null;
}

export default function AddToCart({ 
  variants, 
  primaryColors, 
  secondaryColors, 
  sizes, 
  productName, 
  coverImage, 
  productSlug 
}: Props) {
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
      const secondaryParam = searchParams.get('secondary');
      if (secondaryParam && secondaryColors.includes(secondaryParam.toLowerCase())) {
        return secondaryParam.toLowerCase();
      }
      return secondaryColors[0];
    }
  );

  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    () => {
      const sizeParam = searchParams.get('size');
      if (sizeParam && sizes.includes(sizeParam)) {
        return sizeParam;
      }
      return sizes[0];
    }
  );

  const [selectedResolution, setSelectedResolution] = useState<'normal' | 'high'>('normal');

  // Get stock for a primary color
  const getStockForPrimary = (color: string) => {
    const variant = variants.find(v => v.color === color);
    return variant ? variant.stock : 999;
  };

  // Check if primary is available
  const isPrimaryAvailable = (color: string) => {
    const stock = getStockForPrimary(color);
    return stock > 0;
  };

  const selectedVariant = useMemo(() => {
    if (!selectedPrimary) return null;
    return variants.find(v => v.color === selectedPrimary);
  }, [variants, selectedPrimary]);

  const priceCents = (selectedVariant?.priceCents || 9900) + (selectedResolution === 'high' ? 500 : 0);
  const totalCents = priceCents * quantity;
  const formattedTotal = formatCentsAsCurrency(totalCents);

  // Disable add if no selections or primary out of stock
  const canAdd = selectedPrimary && selectedSecondary && selectedSize && selectedResolution && isPrimaryAvailable(selectedPrimary);

  // Reset added if selections change
  useEffect(() => {
    setAdded(false);
  }, [selectedPrimary, selectedSecondary, selectedSize, selectedResolution]);

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
          fullCart = { items: parsed, discountCode: null };
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
        item.attributes?.color === selectedSecondary && 
        item.attributes?.size === selectedSize &&
        item.attributes?.resolution === selectedResolution
      );

      if (existingItemIndex >= 0) {
        // Update existing
        const existingItem = cart[existingItemIndex];
        cart[existingItemIndex] = { 
          ...existingItem, 
          quantity: existingItem.quantity + quantity,
          priceCents: priceCents 
        };
      } else {
        // Add new
        const newItem: CartItem = {
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          productName,
          image: coverImage,
          variantId: selectedVariant.id,
          quantity,
          priceCents,
          variant: { name: selectedPrimary },
          attributes: { 
            color: selectedSecondary, 
            size: selectedSize,
            resolution: selectedResolution
          },
          productSlug,
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

        .glow {
          animation: glow 2s ease-in-out infinite;
        }
      `}</style>
      <div className="space-y-4">
        {/* Primary Color */}
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
                    {color}
                    {!available && " (Out of Stock)"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Secondary Color */}
        <div className="grid gap-2">
          <label className="text-sm text-neutral-700">Secondary Color</label>
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

        {/* Size */}
        <div className="grid gap-2">
          <label className="text-sm text-neutral-700">Size (US Men&apos;s)</label>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const isSelected = selectedSize === size;
              return (
                <button
                  key={`size-${size}`}
                  onClick={() => setSelectedSize(size)}
                  className={`rounded-full px-2 py-2 text-sm text-neutral-900 ring-1 transition ${
                    isSelected 
                      ? "bg-black text-white ring-black glow" 
                      : "ring-black/10 hover:bg-black/5"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>

        {/* Resolution */}
        <div className="grid gap-2">
          <label className="text-sm text-neutral-700">Print Quality</label>
          <div className="flex gap-2">
            {(['normal' as const, 'high' as const] as const).map((res) => {
              const isSelected = selectedResolution === res;
              const label = res === 'high' ? 'High Resolution' : 'Standard';
              return (
                <button
                  key={res}
                  onClick={() => setSelectedResolution(res)}
                  className={`rounded-full px-3 py-2 text-sm transition ring-1 ${
                    isSelected 
                      ? "bg-black text-white ring-black" 
                      : "ring-black/10 hover:bg-black/5 text-neutral-900"
                  }`}
                >
                  {label}
                </button>
              );
            })}
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
            disabled={loading || added || !canAdd} 
            className={`rounded-full px-6 py-3 text-sm font-medium h-[48px] flex-1 transition-colors ${
              loading || !canAdd
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
    </>
  );
}


