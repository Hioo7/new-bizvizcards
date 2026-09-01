import test from "node:test";
import assert from "node:assert/strict";
import { colors, radius, cssVariables } from "../dist/index.js";

test("primary is the bizviz blue", () => {
  assert.equal(colors.primary, "#2D2DE0");
});

test("has all 20 color tokens", () => {
  assert.equal(Object.keys(colors).length, 20);
});

test("radius.field is 12", () => {
  assert.equal(radius.field, 12);
});

test("cssVariables emits --color-* and --radius-*", () => {
  const v = cssVariables();
  assert.equal(v["--color-primary"], "#2D2DE0");
  assert.equal(v["--radius-field"], "12px");
});
