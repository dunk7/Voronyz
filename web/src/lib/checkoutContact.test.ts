import assert from "node:assert/strict";
import { test } from "node:test";
import {
  checkoutContactEmailError,
  normalizeCheckoutContact,
} from "./checkoutContact";

test("empty contact is allowed", () => {
  assert.deepEqual(normalizeCheckoutContact({}), {
    name: null,
    email: null,
    phone: null,
  });
  assert.deepEqual(normalizeCheckoutContact(null), {
    name: null,
    email: null,
    phone: null,
  });
  assert.equal(checkoutContactEmailError(null), null);
});

test("trims filled contact fields", () => {
  assert.deepEqual(
    normalizeCheckoutContact({
      name: "  Ada  ",
      email: " ada@example.com ",
      phone: " 555 ",
    }),
    {
      name: "Ada",
      email: "ada@example.com",
      phone: "555",
    }
  );
});

test("rejects a filled invalid email", () => {
  assert.equal(
    checkoutContactEmailError("not-an-email"),
    "Please enter a valid email address."
  );
  assert.equal(checkoutContactEmailError("ada@example.com"), null);
});
