/** Checkout contact fields are recommended, not required. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CheckoutContact = {
  name: string | null;
  email: string | null;
  phone: string | null;
};

function trimString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeCheckoutContact(raw: unknown): CheckoutContact {
  const rec = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const name = trimString(rec.name);
  const email = trimString(rec.email);
  const phone = trimString(rec.phone);
  return {
    name: name || null,
    email: email || null,
    phone: phone || null,
  };
}

/** Empty email is allowed. A filled value must look like an email. */
export function checkoutContactEmailError(email: string | null): string | null {
  if (!email) return null;
  if (!EMAIL_RE.test(email)) return "Please enter a valid email address.";
  return null;
}
