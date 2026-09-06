import assert from "node:assert/strict";
import { test } from "node:test";
import { parseMessageEnabledValue } from "./messageEnabledValue";

test("messenger is on when the setting is missing or blank", () => {
  assert.equal(parseMessageEnabledValue(null), true);
  assert.equal(parseMessageEnabledValue(undefined), true);
  assert.equal(parseMessageEnabledValue(""), true);
  assert.equal(parseMessageEnabledValue("   "), true);
});

test("messenger follows explicit on/off values", () => {
  assert.equal(parseMessageEnabledValue("true"), true);
  assert.equal(parseMessageEnabledValue("1"), true);
  assert.equal(parseMessageEnabledValue("yes"), true);
  assert.equal(parseMessageEnabledValue("false"), false);
  assert.equal(parseMessageEnabledValue("0"), false);
  assert.equal(parseMessageEnabledValue("off"), false);
});
