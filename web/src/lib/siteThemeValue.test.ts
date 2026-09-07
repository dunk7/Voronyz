import assert from "node:assert/strict";
import { test } from "node:test";
import { isThemeExemptPath, parseSiteDarkModeValue } from "./siteThemeValue";

test("storefront stays regular when the setting is missing or blank", () => {
  assert.equal(parseSiteDarkModeValue(null), false);
  assert.equal(parseSiteDarkModeValue(undefined), false);
  assert.equal(parseSiteDarkModeValue(""), false);
  assert.equal(parseSiteDarkModeValue("   "), false);
});

test("dark mode follows explicit on/off values", () => {
  assert.equal(parseSiteDarkModeValue("true"), true);
  assert.equal(parseSiteDarkModeValue("1"), true);
  assert.equal(parseSiteDarkModeValue("yes"), true);
  assert.equal(parseSiteDarkModeValue("dark"), true);
  assert.equal(parseSiteDarkModeValue("false"), false);
  assert.equal(parseSiteDarkModeValue("0"), false);
  assert.equal(parseSiteDarkModeValue("light"), false);
  assert.equal(parseSiteDarkModeValue("off"), false);
});

test("admin and messenger stay on their own colors; the shop follows the toggle", () => {
  assert.equal(isThemeExemptPath("/orders"), true);
  assert.equal(isThemeExemptPath("/orders/"), true);
  assert.equal(isThemeExemptPath("/message"), true);
  assert.equal(isThemeExemptPath("/message/inbox"), true);
  assert.equal(isThemeExemptPath("/"), false);
  assert.equal(isThemeExemptPath("/products"), false);
  assert.equal(isThemeExemptPath("/products/v3-slides"), false);
});
