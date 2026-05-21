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

  let shipping: OrderShipping | null = null;
  if (isRecord(metadata.shipping)) {
    const address = isRecord(metadata.shipping.address)
      ? {
          line1: String(metadata.shipping.address.line1 ?? ""),
          line2:
            metadata.shipping.address.line2 != null
              ? String(metadata.shipping.address.line2)
              : null,
          city: String(metadata.shipping.address.city ?? ""),
          state: String(metadata.shipping.address.state ?? ""),
          postal_code: String(metadata.shipping.address.postal_code ?? ""),
          country: String(metadata.shipping.address.country ?? ""),
        }
      : null;

    shipping = {
      name: typeof metadata.shipping.name === "string" ? metadata.shipping.name : null,
      address,
    };
  }

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
  if (!shipping?.address) return "";
  const { address } = shipping;
  const lines = [
    shipping.name || "",
    address.line1,
    address.line2 || "",
    `${address.city}, ${address.state} ${address.postal_code}`,
    address.country,
  ].filter(Boolean);
  return lines.join("\n");
}
