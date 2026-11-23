import {
  looksLikeStreetAddress,
  parseUsFreeformAddress,
} from "@/lib/shippingAddress";

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
  studentName?: string;
  /** Paid waitlist reservation — ships when product arrives. */
  isPreOrder?: boolean;
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
  discountCode?: string | null;
  hasPreOrder?: boolean;
  /** Internal admin-only notes (not shown to customers). */
  adminNotes?: string | null;
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

/**
 * If a street address was wrongly stored in `shipping.name` (and the real
 * address fields are empty), move it into `address` and clear the name.
 * Keeps person names in `name` and street lines in `address`.
 */
export function normalizeOrderShipping(
  shipping: OrderShipping | null | undefined
): OrderShipping | null {
  if (!shipping) return null;

  const rawName = shipping.name?.trim() || null;
  let address =
    shipping.address && hasAddressContent(shipping.address)
      ? shipping.address
      : null;
  let name = rawName;

  if (!address && rawName && looksLikeStreetAddress(rawName)) {
    const parsed = parseUsFreeformAddress(rawName);
    if (parsed) {
      address = {
        line1: parsed.line1,
        line2: parsed.line2,
        city: parsed.city,
        state: parsed.state,
        postal_code: parsed.postal_code,
        country: parsed.country,
      };
    } else {
      address = {
        line1: rawName,
        line2: null,
        city: "",
        state: "",
        postal_code: "",
        country: "US",
      };
    }
    name = null;
  } else if (name && looksLikeStreetAddress(name) && address) {
    // Name field got a street dump even though address fields exist.
    name = null;
  }

  if (!name && !address) return null;
  return { name, address };
}

/** Person name for list rows — never a street address. */
export function orderRecipientName(order: {
  shipping?: OrderShipping | null;
  customer?: OrderCustomer | null;
}): string {
  const shipping = normalizeOrderShipping(order.shipping ?? null);
  const name = shipping?.name?.trim();
  if (name) return name;
  const customerName = order.customer?.name?.trim();
  if (customerName && !looksLikeStreetAddress(customerName)) return customerName;
  return "—";
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
  discountCode: string | null;
  hasPreOrder: boolean;
  adminNotes: string | null;
} {
  if (!isRecord(metadata)) {
    return {
      orderNumber: null,
      customer: null,
      shipping: null,
      lineItems: [],
      paymentMethod: null,
      discountCode: null,
      hasPreOrder: false,
      adminNotes: null,
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

  const shipping = normalizeOrderShipping(resolveOrderShipping(metadata));

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
        studentName:
          typeof raw.studentName === "string" ? raw.studentName : undefined,
        isPreOrder: raw.isPreOrder === true,
      });
    }
  }

  const paymentMethod =
    typeof metadata.paymentMethod === "string" ? metadata.paymentMethod : null;

  const discountCodeRaw =
    typeof metadata.discountCode === "string" ? metadata.discountCode.trim() : "";
  const discountCode = discountCodeRaw ? discountCodeRaw : null;

  const hasPreOrder =
    metadata.hasPreOrder === true ||
    lineItems.some((item) => item.isPreOrder);

  const adminNotesRaw =
    typeof metadata.adminNotes === "string" ? metadata.adminNotes : "";
  const adminNotes = adminNotesRaw.trim() ? adminNotesRaw : null;

  return {
    orderNumber,
    customer,
    shipping,
    lineItems,
    paymentMethod,
    discountCode,
    hasPreOrder,
    adminNotes,
  };
}

export function formatShippingAddress(shipping: OrderShipping | null): string {
  const normalized = normalizeOrderShipping(shipping);
  if (!normalized || !hasAddressContent(normalized.address)) return "";

  const { address } = normalized;
  const cityLine = [address!.city, address!.state, address!.postal_code]
    .filter((p) => p?.trim())
    .join(", ")
    .replace(/,\s*,/g, ",")
    .trim();

  const lines = [
    normalized.name || "",
    address!.line1,
    address!.line2 || "",
    cityLine,
    address!.country,
  ].filter((line) => line && String(line).trim());

  return lines.join("\n");
}

/**
 * Build/replace order shipping from an admin freeform paste.
 * `name` stays a person name; street text goes into address fields.
 */
export function shippingFromManualEntry(input: {
  name?: string | null;
  addressText?: string | null;
  address?: OrderAddress | null;
}): OrderShipping | null {
  const rawName = (input.name ?? "").trim();
  const name =
    rawName && !looksLikeStreetAddress(rawName) ? rawName : null;

  let address: OrderAddress | null =
    input.address && hasAddressContent(input.address) ? input.address : null;

  const text = (input.addressText ?? "").trim();
  if (!address && text) {
    const parsed = parseUsFreeformAddress(text);
    if (parsed) {
      address = {
        line1: parsed.line1,
        line2: parsed.line2,
        city: parsed.city,
        state: parsed.state,
        postal_code: parsed.postal_code,
        country: parsed.country,
      };
    } else {
      // Accept imperfect manual paste (e.g. copied from Pirate Ship) as line1.
      address = {
        line1: text.replace(/\s+/g, " ").trim(),
        line2: null,
        city: "",
        state: "",
        postal_code: "",
        country: "US",
      };
    }
  }

  // If they only pasted into the name box, recover it as the address.
  if (!address && rawName && looksLikeStreetAddress(rawName)) {
    return normalizeOrderShipping({ name: rawName, address: null });
  }

  return normalizeOrderShipping({ name, address });
}
