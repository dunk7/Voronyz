import assert from "node:assert/strict";
import { test } from "node:test";
import { loopPeriodFromOffsets, wrapToMiddleCopy } from "./footwearBrowseLoop";

test("wrapToMiddleCopy stays on the middle copy", () => {
  const period = 1000;
  assert.equal(wrapToMiddleCopy(0, period), period);
  assert.equal(wrapToMiddleCopy(period, period), period);
  assert.equal(wrapToMiddleCopy(period * 2, period), period);
  assert.equal(wrapToMiddleCopy(period * 2 + 40, period), period + 40);
  assert.equal(wrapToMiddleCopy(period - 1, period), period * 2 - 1);
  assert.equal(wrapToMiddleCopy(1500, period), 1500);
});

test("wrapToMiddleCopy ignores a missing period", () => {
  assert.equal(wrapToMiddleCopy(120, 0), 120);
  assert.equal(wrapToMiddleCopy(120, Number.NaN), 120);
});

test("loopPeriodFromOffsets is the gap between matching cards", () => {
  assert.equal(loopPeriodFromOffsets(12, 1012), 1000);
  assert.equal(loopPeriodFromOffsets(100, 50), 0);
});
