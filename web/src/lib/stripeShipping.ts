import type { OrderShipping } from "@/lib/orderTypes";
import { hasAddressContent } from "@/lib/orderTypes";

type StripeLikeAddress = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
};

type StripeLikeShippingDetails = {
  name?: string | null;
  address?: StripeLikeAddress | null;
};

function toOrderAddress(address: StripeLikeAddress) {
  return {
    line1: address.line1 ?? "",
    line2: address.line2 ?? null,
    city: address.city ?? "",
    state: address.state ?? "",
    postal_code: address.postal_code ?? "",
    country: address.country ?? "",
  };
}

/** Build ship-to from Stripe checkout session fields (multiple API shapes). */
export function shippingFromStripeSession(session: {
  shipping_details?: StripeLikeShippingDetails | null;
  collected_information?: {
    shipping_details?: StripeLikeShippingDetails | null;
  } | null;
  customer_details?: {
    name?: string | null;
    address?: StripeLikeAddress | null;
  } | null;
}): OrderShipping | null {
  const shippingDetails =
    session.shipping_details ??
    session.collected_information?.shipping_details ??
    null;

  if (shippingDetails?.address) {
    const address = toOrderAddress(shippingDetails.address);
    if (hasAddressContent(address)) {
      return {
        name: shippingDetails.name ?? null,
        address,
      };
    }
  }

  const customerAddress = session.customer_details?.address;
  if (customerAddress) {
    const address = toOrderAddress(customerAddress);
    if (hasAddressContent(address)) {
      return {
        name:
          session.customer_details?.name ??
          shippingDetails?.name ??
          null,
        address,
      };
    }
  }

  return null;
}
