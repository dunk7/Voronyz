const BRAND = "Voronyz";
export const PRODUCT_SHARE_BRAND = BRAND;
export const PRODUCT_SHARE_MAX_DESCRIPTION_CHARS = 220;

export function cleanShareDescription(raw?: string) {
  if (!raw) return "";
  return raw
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncateShareText(text: string, maxChars: number) {
  if (text.length <= maxChars) return text;
  const sliced = text.slice(0, maxChars - 1).trimEnd();
  const lastSpace = sliced.lastIndexOf(" ");
  const base = lastSpace > maxChars * 0.6 ? sliced.slice(0, lastSpace) : sliced;
  return `${base}…`;
}

/** Caption for Instagram / share sheet: brand, title, description, link — never price. */
export function buildShareCaption({
  productName,
  productDescription,
  url,
}: {
  productName?: string;
  productDescription?: string;
  url: string;
}) {
  const title = productName?.trim() || BRAND;
  const description = truncateShareText(
    cleanShareDescription(productDescription),
    PRODUCT_SHARE_MAX_DESCRIPTION_CHARS,
  );
  const lines = [BRAND, title];
  if (description) lines.push("", description);
  lines.push("", url);
  return lines.join("\n");
}
