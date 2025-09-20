"use client";
import { Variant } from "@prisma/client";
import { useMemo, useState } from "react";

type Props = {
  variants: Variant[];
  productName?: string;
  coverImage?: string;
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
  attributes?: { size?: number | string; color?: string };
}

export default function AddToCart({ variants, productName, coverImage }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const allSizes = useMemo(() => {
    const values = new Set<(number | string) | undefined>();
    variants.forEach((v) => {
      const size = (v.attributes as VariantAttributes)?.size;
      if (size !== undefined) values.add(size);
    });
    return Array.from(values).filter((v): v is number | string => v !== undefined);
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
    allSizes[0]
  );
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    allColors[0]
  );

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

  function add() {
    setLoading(true);
    setAdded(false);

    try {
      // Get existing cart from localStorage
      const cartData = localStorage.getItem("cart");
      let cart: CartItem[] = [];
      if (cartData) {
        cart = JSON.parse(cartData);
      }

      // Ensure selected variant exists
      if (!selectedVariant) {
        throw new Error("Variant not found");
      }

      // Check if item already exists in cart
      const existingItemIndex = cart.findIndex(item => item.variantId === selectedVariant.id);

      if (existingItemIndex >= 0) {
        // Update existing item
        cart[existingItemIndex].quantity += quantity;
      } else {
        // Add new item
        const newItem: CartItem = {
          id: `item-${Date.now()}`,
          productName: productName,
          image: coverImage,
          variantId: selectedVariant.id,
          quantity,
          priceCents: selectedVariant.priceCents || 0,
          variant: { name: selectedVariant.name || "Default" },
          attributes: { size: selectedSize, color: selectedColor }
        };
        cart.push(newItem);
      }

      // Save to localStorage
      localStorage.setItem("cart", JSON.stringify(cart));
      setAdded(true);
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {(allSizes.length > 0) && (
        <div className="grid gap-2">
          <label className="text-sm text-neutral-700">Select Size</label>
          <div className="flex flex-wrap gap-2">
            {allSizes.map((size) => (
              <button
                key={`size-${size}`}
                onClick={() => setSelectedSize(size)}
                className={`rounded-full px-4 py-2 text-sm ring-1 transition ${selectedSize === size ? "bg-black text-white ring-black" : "ring-black/10 hover:bg-black/5"}`}
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
            {allColors.map((color) => (
              <button
                key={`color-${color}`}
                onClick={() => setSelectedColor(color)}
                title={color}
                className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm ring-1 transition ${selectedColor === color ? "ring-black" : "ring-black/10 hover:ring-black/20"}`}
              >
                <span
                  className="inline-block h-4 w-4 rounded-full ring-1 ring-black/10"
                  style={{ backgroundColor: color }}
                />
                <span className="capitalize">{color}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center gap-3">
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
          className="w-20 rounded-md border border-black/10 px-3 py-2 text-sm"
        />
        <button onClick={add} disabled={loading || !selectedVariant} className="rounded-full bg-black text-white px-6 py-3 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50">
          {loading ? "Adding…" : "Add to Cart"}
        </button>
        {added && <span className="text-sm text-green-600">Added</span>}
      </div>
    </div>
  );
}


