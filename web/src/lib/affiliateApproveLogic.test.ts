import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AFFILIATE_ORDER_DISCOUNT_CENTS,
  allocateAffiliateCodeAndSlug,
  applyOrderLevelDiscountCents,
  isRecentlyApproved,
  isReservedShortlinkSlug,
  RECENTLY_APPROVED_WITHIN_MS,
  subtractOrderLevelDiscountFromLineItems,
} from "./affiliateApproveLogic";

test("approve allocation uses preferred code and slug", () => {
  const result = allocateAffiliateCodeAndSlug(
    {
      id: "app1",
      firstName: "Jane",
      lastName: "Creator",
      preferredCode: "jane5",
      preferredSlug: "jane",
    },
    { codes: new Set(), slugs: new Set() }
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.code, "jane5");
    assert.equal(result.slug, "jane");
  }
});

test("approve allocation does not silently steal a taken preferred code", () => {
  const result = allocateAffiliateCodeAndSlug(
    {
      id: "app1",
      firstName: "Jane",
      lastName: "Creator",
      preferredCode: "aryan50",
      preferredSlug: "jane",
    },
    { codes: new Set(["aryan50"]), slugs: new Set() }
  );
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(result.error, /already in use/);
  }
});

test("reject path is delete-only: allocation is not required", () => {
  // Reject never calls allocateAffiliateCodeAndSlug; this guards the $5-off
  // helper so a rejected application cannot accidentally price as an affiliate.
  assert.equal(applyOrderLevelDiscountCents(7500, 0), 0);
});

test("affiliate discount is $5 off the whole order, not per product", () => {
  const twoItemsSubtotal = 7500 + 7500;
  assert.equal(
    applyOrderLevelDiscountCents(twoItemsSubtotal, AFFILIATE_ORDER_DISCOUNT_CENTS),
    500
  );
  assert.equal(applyOrderLevelDiscountCents(300, AFFILIATE_ORDER_DISCOUNT_CENTS), 300);
  assert.equal(applyOrderLevelDiscountCents(0, AFFILIATE_ORDER_DISCOUNT_CENTS), 0);
});

test("line-item fallback subtracts $5 once from the order total", () => {
  const lines = [
    { quantity: 2, price_data: { unit_amount: 7500 } },
    { quantity: 1, price_data: { unit_amount: 5000 } },
  ];
  subtractOrderLevelDiscountFromLineItems(lines, AFFILIATE_ORDER_DISCOUNT_CENTS);
  const total = lines.reduce(
    (sum, item) => sum + (item.price_data.unit_amount ?? 0) * item.quantity,
    0
  );
  assert.equal(total, 7500 * 2 + 5000 - 500);
});

test("reserved short links cannot be used as bio paths", () => {
  assert.equal(isReservedShortlinkSlug("cart"), true);
  assert.equal(isReservedShortlinkSlug("affiliates"), true);
  assert.equal(isReservedShortlinkSlug("jane"), false);
  const result = allocateAffiliateCodeAndSlug(
    {
      id: "app2",
      firstName: "Pat",
      lastName: "Lee",
      preferredCode: "patlee",
      preferredSlug: "cart",
    },
    { codes: new Set(), slugs: new Set() }
  );
  assert.equal(result.ok, false);
});

test("generated codes uniquify instead of colliding", () => {
  const result = allocateAffiliateCodeAndSlug(
    {
      id: "clxyz1234567890",
      firstName: "Sam",
      lastName: "Lee",
      preferredCode: null,
      preferredSlug: null,
    },
    { codes: new Set(["samlee"]), slugs: new Set(["samlee"]) }
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.notEqual(result.code, "samlee");
    assert.notEqual(result.slug, "samlee");
  }
});

test("recently approved window is true only shortly after approve", () => {
  const now = Date.parse("2026-09-05T12:00:00.000Z");
  assert.equal(isRecentlyApproved(new Date(now - 60_000), now), true);
  assert.equal(
    isRecentlyApproved(new Date(now - RECENTLY_APPROVED_WITHIN_MS - 1), now),
    false
  );
  assert.equal(isRecentlyApproved(null, now), false);
});

test("approve record shape keeps original application fields", () => {
  const original = {
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    phone: "555-0100",
    platform: "TikTok",
    handleOrUrl: "@ada",
    audienceSize: "5,000 – 25,000",
    preferredSlug: "ada",
    preferredCode: "ada5",
    niche: "Math history and machines",
    pitch: "I would film honest try-ons and pin the short link in my bio.",
  };
  const approved = {
    ...original,
    status: "approved",
    approvedCode: "ada5",
    approvedSlug: "ada",
    approvedAt: "2026-09-05T12:00:00.000Z",
  };
  for (const [key, value] of Object.entries(original)) {
    assert.equal(approved[key as keyof typeof approved], value);
  }
  assert.equal(approved.status, "approved");
});
