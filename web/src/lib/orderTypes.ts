export type OrderAddress = {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

export type OrderLineItem = {
  name: string;
  productName?: string;
  productSlug?: string;
  variantId?: string;
  variantName?: string;
  size?: string;
  gender?: string;
  baseColor?: string;
  secondaryColor?: string;
  quantity: number;
  amount: number;
  image?: string;
};

export type OrderCustomer = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

export type OrderShipping = {
  name?: string | null;
  address?: OrderAddress | null;
};

export type AdminOrder = {
  id: string;
  status: string;
  currency: string;
  subtotalCents: number;
  totalCents: number;
  createdAt: string;
  updatedAt: string;
  orderNumber: string | null;
  customer: OrderCustomer | null;
  shipping: OrderShipping | null;
  lineItems: OrderLineItem[];
  paymentMethod?: string | null;
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function pickString(
  record: Record<string, unknown>,
  keys: string[]
): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

export function hasAddressContent(address: OrderAddress | null | undefined): boolean {
  if (!address) return false;
  return Boolean(
    address.line1?.trim() ||
      address.line2?.trim() ||
      (address.city?.trim() &&
        (address.state?.trim() || address.postal_code?.trim())) ||
      address.postal_code?.trim()
  );
}

export function parseAddressFromRecord(
  record: Record<string, unknown>
): OrderAddress | null {
  const nested = isRecord(record.address) ? record.address : record;

  const line1 = pickString(nested, [
    "line1",
    "line_1",
    "addressLine1",
    "address_line1",
    "street",
    "street1",
    "address1",
  ]);
  const line2 = pickString(nested, [
    "line2",
    "line_2",
    "addressLine2",
    "address_line2",
    "street2",
    "address2",
  ]);
  const city = pickString(nested, ["city", "locality", "town"]);
  const state = pickString(nested, [
    "state",
    "region",
    "province",
    "administrative_area",
  ]);
  const postal_code = pickString(nested, [
    "postal_code",
    "postalCode",
    "zip",
    "zipCode",
    "postcode",
  ]);
  const country = pickString(nested, ["country", "countryCode"]) ?? "";

  const address: OrderAddress = {
    line1: line1 ?? "",
    line2: line2,
    city: city ?? "",
    state: state ?? "",
    postal_code: postal_code ?? "",
    country,
  };

  return hasAddressContent(address) ? address : null;
}

export function parseShippingFromRecord(
  record: Record<string, unknown>
): OrderShipping | null {
  const name = pickString(record, ["name", "recipient", "fullName", "full_name"]);
  const address = parseAddressFromRecord(record);

  if (!name && !address) return null;

  return {
    name: name ?? null,
    address,
  };
}

/** Best available ship-to from order metadata (shipping, billing, flat fields). */
export function resolveOrderShipping(metadata: unknown): OrderShipping | null {
  if (!isRecord(metadata)) return null;

  const candidates: unknown[] = [
    metadata.shipping,
    metadata.billing,
    metadata.shippingAddress,
    metadata.shipTo,
    metadata.customer,
  ];

  for (const candidate of candidates) {
    if (!isRecord(candidate)) continue;
    const parsed = parseShippingFromRecord(candidate);
    if (parsed && hasAddressContent(parsed.address)) {
      return parsed;
    }
  }

  return null;
}

/** Keep existing DB shipping when a new write would wipe it with null/empty. */
export function preferNonEmptyShipping(
  incoming: OrderShipping | null,
  existing: unknown
): OrderShipping | null {
  if (incoming && hasAddressContent(incoming.address)) {
    return incoming;
  }

  if (isRecord(existing)) {
    const parsed = parseShippingFromRecord(existing);
    if (parsed && hasAddressContent(parsed.address)) {
      return parsed;
    }
  }

  return incoming;
}

export function parseOrderMetadata(metadata: unknown): {
  orderNumber: string | null;
  customer: OrderCustomer | null;
  shipping: OrderShipping | null;
  lineItems: OrderLineItem[];
  paymentMethod: string | null;
} {
  if (!isRecord(metadata)) {
    return {
      orderNumber: null,
      customer: null,
      shipping: null,
      lineItems: [],
      paymentMethod: null,
    };
  }

  const orderNumber =
    typeof metadata.orderNumber === "string" ? metadata.orderNumber : null;

  const customer = isRecord(metadata.customer)
    ? {
        name: typeof metadata.customer.name === "string" ? metadata.customer.name : null,
        email: typeof metadata.customer.email === "string" ? metadata.customer.email : null,
        phone: typeof metadata.customer.phone === "string" ? metadata.customer.phone : null,
      }
    : null;

  const shipping = resolveOrderShipping(metadata);

  const lineItems: OrderLineItem[] = [];
  if (Array.isArray(metadata.lineItems)) {
    for (const raw of metadata.lineItems) {
      if (!isRecord(raw)) continue;
      lineItems.push({
        name: String(raw.name ?? raw.productName ?? "Item"),
        productName:
          typeof raw.productName === "string" ? raw.productName : undefined,
        productSlug:
          typeof raw.productSlug === "string" ? raw.productSlug : undefined,
        variantId: typeof raw.variantId === "string" ? raw.variantId : undefined,
        variantName:
          typeof raw.variantName === "string" ? raw.variantName : undefined,
        size: raw.size != null ? String(raw.size) : undefined,
        gender: typeof raw.gender === "string" ? raw.gender : undefined,
        baseColor:
          typeof raw.baseColor === "string"
            ? raw.baseColor
            : typeof raw.color === "string"
              ? raw.color
              : undefined,
        secondaryColor:
          typeof raw.secondaryColor === "string" ? raw.secondaryColor : undefined,
        quantity: typeof raw.quantity === "number" ? raw.quantity : 1,
        amount: typeof raw.amount === "number" ? raw.amount : 0,
        image: typeof raw.image === "string" ? raw.image : undefined,
      });
    }
  }

  const paymentMethod =
    typeof metadata.paymentMethod === "string" ? metadata.paymentMethod : null;

  return { orderNumber, customer, shipping, lineItems, paymentMethod };
}

export function formatShippingAddress(shipping: OrderShipping | null): string {
  if (!shipping || !hasAddressContent(shipping.address)) return "";

  const { address } = shipping;
  const cityLine = [address!.city, address!.state, address!.postal_code]
    .filter((p) => p?.trim())
    .join(", ")
    .replace(/,\s*,/g, ",")
    .trim();

  const lines = [
    shipping.name || "",
    address!.line1,
    address!.line2 || "",
    cityLine,
    address!.country,
  ].filter((line) => line && String(line).trim());

  return lines.join("\n");
}
