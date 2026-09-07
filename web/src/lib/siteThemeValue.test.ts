import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import {
  isThemeExemptPath,
  parseSiteDarkModeValue,
  shouldApplySiteDarkClass,
  siteThemeBootScript,
} from "./siteThemeValue";

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

test("site-dark is only applied on shop pages when the setting is on", () => {
  assert.equal(shouldApplySiteDarkClass(true, "/"), true);
  assert.equal(shouldApplySiteDarkClass(true, "/products/v3-slides"), true);
  assert.equal(shouldApplySiteDarkClass(true, "/orders"), false);
  assert.equal(shouldApplySiteDarkClass(true, "/message"), false);
  assert.equal(shouldApplySiteDarkClass(false, "/"), false);
});

function runBootScript(script: string, pathname: string) {
  const classes = new Set<string>();
  runInNewContext(script, {
    location: { pathname },
    document: {
      documentElement: {
        classList: {
          add: (name: string) => {
            classes.add(name);
          },
          remove: (name: string) => {
            classes.delete(name);
          },
        },
      },
    },
  });
  return classes;
}

test("boot script adds site-dark on the shop when dark mode is on", () => {
  const script = siteThemeBootScript(true);
  assert.match(script, /var dark=true/);
  assert.doesNotMatch(script, /==="1"/);
  assert.ok(runBootScript(script, "/").has("site-dark"));
  assert.ok(runBootScript(script, "/products").has("site-dark"));
});

test("boot script leaves admin and messenger without site-dark", () => {
  const script = siteThemeBootScript(true);
  assert.equal(runBootScript(script, "/orders").has("site-dark"), false);
  assert.equal(runBootScript(script, "/message").has("site-dark"), false);
});

test("boot script clears site-dark when dark mode is off", () => {
  const script = siteThemeBootScript(false);
  assert.match(script, /var dark=false/);
  assert.equal(runBootScript(script, "/").has("site-dark"), false);
});

test("root layout inlines the boolean boot script, not the broken number===string check", () => {
  const layout = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../app/layout.tsx"), "utf8");
  assert.match(layout, /siteThemeBootScript\(darkMode\)/);
  assert.doesNotMatch(layout, /d==="1"/);
});
