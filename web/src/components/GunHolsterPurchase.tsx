"use client";

import { useMemo, useState } from "react";
import AddToCart from "@/components/cart/AddToCart";
import V3Gallery from "@/components/V3Gallery";
import {
  GUN_HOLSTER_CARRY_STYLES,
  getGunHolsterCarryStyle,
  type GunHolsterCarryStyleId,
} from "@/lib/gunHolster";

type Variant = {
  id: string;
  color: string;
  sku: string;
  stock: number;
  priceCents: number | null;
};

type Props = {
  variants: Variant[];
  primaryColors: string[];
  productPriceCents: number;
  productName: string;
  productSlug: string;
};

export default function GunHolsterPurchase({
  variants,
  primaryColors,
  productPriceCents,
  productName,
  productSlug,
}: Props) {
  const [carryStyleId, setCarryStyleId] = useState<GunHolsterCarryStyleId>(
    GUN_HOLSTER_CARRY_STYLES[0].id
  );
  const carryStyle = useMemo(
    () => getGunHolsterCarryStyle(carryStyleId),
    [carryStyleId]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      <div className="lg:col-span-7">
        <V3Gallery
          key={carryStyle.id}
          media={[
            {
              type: "image",
              src: carryStyle.image,
              alt: `${productName} — ${carryStyle.label} ${carryStyle.description}`,
            },
          ]}
        />
      </div>
      <div className="lg:col-span-5">
        <div className="lg:sticky lg:top-20 space-y-6">
          <AddToCart
            variants={variants}
            primaryColors={primaryColors}
            productPriceCents={productPriceCents}
            hideSizeSelector
            carryStyles={GUN_HOLSTER_CARRY_STYLES}
            selectedCarryStyleId={carryStyleId}
            onCarryStyleChange={(id) =>
              setCarryStyleId(id as GunHolsterCarryStyleId)
            }
            sizes={GUN_HOLSTER_CARRY_STYLES.map((style) => style.id)}
            productName={productName}
            coverImage={carryStyle.image}
            productSlug={productSlug}
          />
        </div>
      </div>
    </div>
  );
}
